import { app, BrowserWindow, dialog, ipcMain, Menu, Notification, session, shell, type IpcMainInvokeEvent } from 'electron'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { randomUUID } from 'crypto'
import type { AccountInfo, MessageAction, NewAccountInput, OutgoingMessage, Settings } from '@shared/types'
import * as store from './store'
import * as mail from './mail'
import * as demo from './demo'
import { authorize, revoke } from './oauth'
import { assertServerSafe, EXECUTABLE_EXT, headerStr, oneOf, posInt, safeFilename, str } from './security'

const isDemo = (id: string): boolean => id === demo.DEMO_ID

const RENDERER_FILE = join(__dirname, '../renderer/index.html')
// The dev-server URL is only honoured in development; a packaged app always loads its own files,
// so an environment variable can never point it at a remote page that would get window.api.
const DEV_URL = app.isPackaged ? undefined : process.env.ELECTRON_RENDERER_URL
const APP_URL = DEV_URL ?? pathToFileURL(RENDERER_FILE).href

const EXTERNAL_LINK = /^(https?|mailto):/i
const ACTIONS: readonly MessageAction[] = ['archive', 'trash', 'seen', 'unseen', 'flag', 'unflag', 'spam']

let mainWindow: BrowserWindow | null = null

/** Files the user chose in the attach dialog. Only these may be sent as attachments. */
const pickedFiles = new Set<string>()

/**
 * Links clicked inside an email go through here. The real destination is shown
 * before anything opens, because link text in HTML email can say anything.
 */
async function confirmOpenLink(url: string): Promise<void> {
  if (!EXTERNAL_LINK.test(url)) return
  let shown = url
  let host = ''
  try {
    const u = new URL(url)
    host = u.protocol === 'mailto:' ? u.pathname : u.hostname
    shown = u.href
  } catch {
    return
  }
  const opts = {
    type: 'question' as const,
    buttons: ['Open link', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Open link?',
    message: `This link goes to:\n${host}`,
    detail: `${shown.length > 600 ? shown.slice(0, 600) + '…' : shown}\n\nOnly continue if you trust this site. Emails can disguise where a link really goes.`
  }
  const { response } = mainWindow ? await dialog.showMessageBox(mainWindow, opts) : await dialog.showMessageBox(opts)
  if (response === 0) await shell.openExternal(shown)
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#02040a',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#7fe8ff', height: 36 },
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false
    }
  })
  mainWindow = win
  win.on('closed', () => (mainWindow = null))
  win.once('ready-to-show', () => win.show())

  // Popups only come from links clicked inside an email body.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void confirmOpenLink(url)
    return { action: 'deny' }
  })
  // The app itself never navigates; an email using target="_top" ends up here.
  win.webContents.on('will-navigate', (e, url) => {
    if (url === win.webContents.getURL()) return
    e.preventDefault()
    void confirmOpenLink(url)
  })

  if (DEV_URL) win.loadURL(DEV_URL)
  else win.loadFile(RENDERER_FILE)
}

/** Only the app's own top-level page may call into the main process. */
function trustedSender(e: IpcMainInvokeEvent): boolean {
  const frame = e.senderFrame
  if (!frame || frame.parent !== null || e.sender !== mainWindow?.webContents) return false
  try {
    // Exact URL comparison, not a prefix match: "localhost:5173.evil.com" must not pass
    const u = new URL(frame.url)
    const app = new URL(APP_URL)
    return u.protocol === app.protocol && u.host === app.host && u.pathname === app.pathname
  } catch {
    return false
  }
}

function handle(channel: string, fn: (...args: unknown[]) => unknown): void {
  ipcMain.handle(channel, async (e, ...args) => {
    if (!trustedSender(e)) throw new Error('Blocked IPC from untrusted frame')
    return fn(...args)
  })
}

function serverInput(v: unknown, name: string): NewAccountInput['imap'] {
  const s = v as NewAccountInput['imap']
  if (!s || typeof s !== 'object') throw new Error(`Invalid ${name}`)
  return {
    host: str(s.host, `${name} host`, 255).trim(),
    port: Number.isInteger(s.port) && s.port >= 0 && s.port <= 65535 ? s.port : 0,
    secure: s.secure === true,
    allowSelfSigned: s.allowSelfSigned === true
  }
}

function accountInput(v: unknown): NewAccountInput {
  const i = v as NewAccountInput
  if (!i || typeof i !== 'object') throw new Error('Invalid account')
  const opt = (x: unknown, name: string, max = 4096): string | undefined => (x == null ? undefined : str(x, name, max))
  return {
    provider: oneOf(i.provider, ['gmail', 'outlook', 'proton', 'imap', 'demo'] as const, 'provider'),
    auth: oneOf(i.auth, ['password', 'oauth-google', 'oauth-microsoft', 'none'] as const, 'auth'),
    email: str(i.email ?? '', 'email', 320).trim(),
    displayName: headerStr(i.displayName ?? '', 'display name', 200),
    label: str(i.label ?? '', 'label', 100),
    color: /^#[0-9a-f]{6}$/i.test(i.color) ? i.color : '#3ef0ff',
    imap: serverInput(i.imap, 'IMAP'),
    smtp: serverInput(i.smtp, 'SMTP'),
    username: opt(i.username, 'username', 320),
    password: opt(i.password, 'password'),
    oauthClientId: opt(i.oauthClientId, 'client ID', 512),
    oauthClientSecret: opt(i.oauthClientSecret, 'client secret', 512)
  }
}

function registerIpc(): void {
  // ---- accounts
  handle('accounts:list', () => store.listAccounts())

  handle('accounts:test', (raw) => mail.test(accountInput(raw)))

  handle('accounts:add', async (raw): Promise<AccountInfo> => {
    const input = accountInput(raw)
    const base = {
      provider: input.provider,
      auth: input.auth,
      label: input.label,
      color: input.color,
      imap: input.imap,
      smtp: input.smtp
    }
    if (input.provider === 'demo') {
      const existing = (await store.listAccounts()).find((a) => isDemo(a.id))
      if (existing) return existing
      return store.addAccount(
        { ...base, id: demo.DEMO_ID, email: 'captain@uss-meridian.ship', displayName: 'Captain' },
        '',
        {}
      )
    }
    assertServerSafe(input.imap, 'IMAP')
    assertServerSafe(input.smtp, 'SMTP')
    if (input.auth === 'oauth-google' || input.auth === 'oauth-microsoft') {
      if (!input.oauthClientId) throw new Error('An OAuth client ID is required')
      const t = await authorize(input.auth, input.oauthClientId, input.oauthClientSecret, input.email || undefined)
      const email = t.email || input.email
      if (!email) throw new Error('Could not determine the account email address')
      return store.addAccount(
        { ...base, id: randomUUID(), email, displayName: input.displayName || t.name || email },
        email,
        {
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
          expiresAt: t.expiresAt,
          clientId: input.oauthClientId,
          clientSecret: input.oauthClientSecret
        }
      )
    }
    if (input.auth !== 'password') throw new Error('Invalid auth')
    return store.addAccount(
      { ...base, id: randomUUID(), email: input.email, displayName: input.displayName || input.email },
      input.username || input.email,
      { password: input.password }
    )
  })

  handle('accounts:update', (id, raw) => {
    const p = (raw ?? {}) as Partial<AccountInfo>
    const patch: Partial<AccountInfo> = {}
    if (p.label !== undefined) patch.label = str(p.label, 'label', 100)
    if (p.displayName !== undefined) patch.displayName = headerStr(p.displayName, 'display name', 200)
    if (p.color !== undefined && /^#[0-9a-f]{6}$/i.test(p.color)) patch.color = p.color
    return store.updateAccount(str(id, 'account', 100), patch)
  })

  handle('accounts:remove', async (raw) => {
    const id = str(raw, 'account', 100)
    await mail.disconnect(id)
    // Best effort: tell the provider these tokens are dead, so deleting the local
    // copy actually ends the session rather than leaving a live token behind.
    try {
      const { info, secrets } = await store.getAccount(id)
      await revoke(info.auth, secrets)
    } catch {
      /* demo or already-gone account; removal continues */
    }
    await store.removeAccount(id)
  })

  // ---- mail
  const acct = (v: unknown): string => str(v, 'account', 100)
  const folder = (v: unknown): string => str(v, 'folder', 1000)

  handle('mail:folders', (id) => (isDemo(acct(id)) ? demo.folders() : mail.folders(acct(id))))
  handle('mail:list', (id, f, cursor, limit) => {
    const lim = Math.min(200, Math.max(1, Number.isInteger(limit) ? (limit as number) : 50))
    const cur = cursor == null ? undefined : posInt(cursor, 'cursor')
    return isDemo(acct(id)) ? demo.list(folder(f)) : mail.list(acct(id), folder(f), cur, lim)
  })
  handle('mail:get', (id, f, uid) =>
    isDemo(acct(id)) ? demo.get(folder(f), posInt(uid, 'uid')) : mail.get(acct(id), folder(f), posInt(uid, 'uid'))
  )
  handle('mail:action', (id, f, uids, act) => {
    if (!Array.isArray(uids) || uids.length === 0 || uids.length > 1000) throw new Error('Invalid uids')
    const list = uids.map((u) => posInt(u, 'uid'))
    const a = oneOf(act, ACTIONS, 'action')
    return isDemo(acct(id)) ? demo.action(folder(f), list, a) : mail.action(acct(id), folder(f), list, a)
  })
  handle('mail:search', (id, f, q) =>
    isDemo(acct(id)) ? demo.search(folder(f), str(q, 'query', 500)) : mail.search(acct(id), folder(f), str(q, 'query', 500))
  )
  handle('mail:send', async (raw) => {
    const m = (raw ?? {}) as OutgoingMessage
    const attachments = (Array.isArray(m.attachments) ? m.attachments : []).map((a) => {
      const p = resolve(str(a?.path, 'attachment', 4096))
      if (!pickedFiles.has(p)) throw new Error('Attachments must be chosen with the attach button')
      return { path: p }
    })
    const msg: OutgoingMessage = {
      accountId: acct(m.accountId),
      to: headerStr(m.to, 'recipients'),
      cc: m.cc ? headerStr(m.cc, 'cc') : undefined,
      bcc: m.bcc ? headerStr(m.bcc, 'bcc') : undefined,
      subject: headerStr(m.subject ?? '', 'subject', 2000),
      text: str(m.text ?? '', 'body', 5_000_000),
      inReplyTo: m.inReplyTo ? headerStr(m.inReplyTo, 'in-reply-to', 1000) : undefined,
      references: Array.isArray(m.references) ? m.references.slice(0, 100).map((r) => headerStr(r, 'references', 1000)) : undefined,
      attachments
    }
    if (isDemo(msg.accountId)) {
      await new Promise((r) => setTimeout(r, 900))
      return demo.send(msg)
    }
    return mail.send(msg)
  })
  handle('mail:saveAttachment', async (id, f, uid, index) => {
    if (isDemo(acct(id))) throw new Error('Demo attachments are holographic — they cannot be saved')
    if (!Number.isInteger(index) || (index as number) < 0) throw new Error('Invalid attachment')
    const a = await mail.attachment(acct(id), folder(f), posInt(uid, 'uid'), index as number)
    // The name comes from the sender: strip any directory part so the dialog
    // can't be pre-pointed at somewhere like the Startup folder.
    const name = safeFilename(a.filename)
    const risky = EXECUTABLE_EXT.test(name)
    const res = await dialog.showSaveDialog(mainWindow!, {
      title: risky ? 'Warning: this file type can run programs on your computer' : 'Save attachment',
      defaultPath: join(app.getPath('downloads'), name)
    })
    if (res.canceled || !res.filePath) return null
    await fs.writeFile(res.filePath, a.content)
    if (process.platform === 'win32') {
      // Mark of the Web: Windows SmartScreen and Office Protected View then treat it as an internet file
      await fs.writeFile(`${res.filePath}:Zone.Identifier`, '[ZoneTransfer]\r\nZoneId=3\r\n').catch(() => undefined)
    }
    return res.filePath
  })
  handle('mail:pickAttachments', async () => {
    const res = await dialog.showOpenDialog(mainWindow!, { properties: ['openFile', 'multiSelections'] })
    if (res.canceled) return []
    for (const p of res.filePaths) pickedFiles.add(resolve(p))
    return res.filePaths
  })

  // ---- settings & app
  handle('settings:get', () => store.getSettings())
  handle('settings:set', (s) => {
    if (!s || typeof s !== 'object' || JSON.stringify(s).length > 20_000) throw new Error('Invalid settings')
    return store.saveSettings(s as Settings)
  })
  // Plain-text links: the full URL is visible in the message, so no extra prompt
  handle('app:openExternal', (raw) => {
    const url = str(raw, 'url', 8000)
    if (/^https?:\/\//i.test(url)) return shell.openExternal(url)
  })
  // Tint the native window buttons to match the theme
  handle('app:titleBarColor', (hex) => {
    if (typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) && process.platform === 'win32') {
      mainWindow?.setTitleBarOverlay({ color: '#00000000', symbolColor: hex, height: 36 })
    }
  })
  handle('app:notify', (title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title: String(title).slice(0, 300), body: String(body).slice(0, 1000), silent: true }).show()
    }
  })
}

// Defence in depth for every web contents the app could ever create
app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (e) => e.preventDefault())
})

app.whenReady().then(() => {
  app.setAppUserModelId('local.starmail')
  // Nothing in StarMail needs camera, mic, location, etc.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, cb) => cb(false))
  session.defaultSession.setPermissionCheckHandler(() => false)
  // The email frame may only ever show the message it was given, never a remote page inside
  // the app (a link with target="_self", a meta refresh...). The app has no legitimate frame
  // loads over the network, so they're cancelled outright. This is enforced at the network
  // layer because navigation events don't fire for the email frame (it runs out-of-process).
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, cb) => {
    cb({ cancel: details.resourceType === 'subFrame' })
  })
  // No DevTools/reload shortcuts in the shipped app
  if (app.isPackaged) Menu.setApplicationMenu(null)
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await mail.disconnectAll()
  if (process.platform !== 'darwin') app.quit()
})
