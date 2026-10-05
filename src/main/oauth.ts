import { shell } from 'electron'
import { createServer } from 'http'
import { AddressInfo } from 'net'
import { createHash, randomBytes } from 'crypto'
import type { AuthKind } from '@shared/types'

/**
 * OAuth 2.0 for installed apps: authorization-code flow with PKCE and a
 * loopback redirect. The user signs in with their normal browser; we never see
 * their password.
 */

interface ProviderEndpoints {
  authUrl: string
  tokenUrl: string
  scopes: string[]
  redirectHost: string
  extraAuthParams: Record<string, string>
}

const PROVIDERS: Record<'oauth-google' | 'oauth-microsoft', ProviderEndpoints> = {
  'oauth-google': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://mail.google.com/', 'openid', 'email', 'profile'],
    redirectHost: '127.0.0.1',
    extraAuthParams: { access_type: 'offline', prompt: 'consent' }
  },
  'oauth-microsoft': {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://outlook.office.com/IMAP.AccessAsUser.All',
      'https://outlook.office.com/SMTP.Send',
      'offline_access',
      'openid',
      'email',
      'profile'
    ],
    // Azure "Mobile and desktop" platform accepts http://localhost on any port
    redirectHost: 'localhost',
    extraAuthParams: { prompt: 'select_account' }
  }
}

export interface TokenSet {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  email?: string
  name?: string
}

const b64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function decodeIdToken(idToken?: string): { email?: string; name?: string } {
  if (!idToken) return {}
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8'))
    return { email: payload.email ?? payload.preferred_username, name: payload.name }
  } catch {
    return {}
  }
}

async function tokenRequest(url: string, params: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  })
  const json = (await res.json()) as Record<string, string | number>
  if (!res.ok) {
    throw new Error(`Token request failed: ${json.error_description ?? json.error ?? res.status}`)
  }
  return {
    accessToken: String(json.access_token),
    refreshToken: json.refresh_token ? String(json.refresh_token) : undefined,
    expiresAt: Date.now() + (Number(json.expires_in ?? 3600) - 60) * 1000,
    ...decodeIdToken(json.id_token as string | undefined)
  }
}

const PAGE = (msg: string): string => `<!doctype html><html><body style="background:#02060f;color:#7fe8ff;
font-family:monospace;display:grid;place-items:center;height:100vh;margin:0;letter-spacing:.15em">
<div style="text-align:center"><div style="font-size:28px">// ${msg} //</div>
<p style="color:#4a7a99">You can close this tab and return to StarMail.</p></div></body></html>`

export async function authorize(
  kind: AuthKind,
  clientId: string,
  clientSecret?: string,
  loginHint?: string
): Promise<TokenSet> {
  if (kind !== 'oauth-google' && kind !== 'oauth-microsoft') throw new Error('Not an OAuth provider')
  const p = PROVIDERS[kind]
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  const state = b64url(randomBytes(16))

  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  const redirectUri = `http://${p.redirectHost}:${port}/`

  const codePromise = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Sign-in timed out')), 5 * 60_000)
    server.on('request', (req, res) => {
      const url = new URL(req.url ?? '/', redirectUri)
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')
      if (!code && !error) {
        res.writeHead(404).end()
        return
      }
      clearTimeout(timer)
      if (error || url.searchParams.get('state') !== state) {
        res.writeHead(400, { 'Content-Type': 'text/html' }).end(PAGE('LINK REJECTED'))
        reject(new Error(url.searchParams.get('error_description') ?? error ?? 'State mismatch'))
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(PAGE('UPLINK ESTABLISHED'))
        resolve(code!)
      }
    })
  })

  const auth = new URL(p.authUrl)
  auth.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: p.scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...(loginHint ? { login_hint: loginHint } : {}),
    ...p.extraAuthParams
  }).toString()
  await shell.openExternal(auth.toString())

  try {
    const code = await codePromise
    return await tokenRequest(p.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
      ...(clientSecret ? { client_secret: clientSecret } : {})
    })
  } finally {
    server.close()
  }
}

/**
 * Best-effort token revocation when an account is removed. Google implements
 * RFC 7009 revocation; revoking the refresh token invalidates the whole grant.
 * Microsoft's consumer endpoint has no revocation API, so those tokens are only
 * deleted locally and expire on their own.
 */
export async function revoke(kind: AuthKind, secrets: { accessToken?: string; refreshToken?: string }): Promise<void> {
  if (kind !== 'oauth-google') return
  const token = secrets.refreshToken ?? secrets.accessToken
  if (!token) return
  await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }).toString(),
    signal: AbortSignal.timeout(10_000)
  }).catch(() => undefined)
}

export function refresh(
  kind: AuthKind,
  clientId: string,
  refreshToken: string,
  clientSecret?: string
): Promise<TokenSet> {
  if (kind !== 'oauth-google' && kind !== 'oauth-microsoft') throw new Error('Not an OAuth provider')
  const p = PROVIDERS[kind]
  return tokenRequest(p.tokenUrl, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    ...(kind === 'oauth-microsoft' ? { scope: p.scopes.join(' ') } : {}),
    ...(clientSecret ? { client_secret: clientSecret } : {})
  })
}
