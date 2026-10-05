import type { Folder, ListResult, MessageAction, MessageDetail, MessageSummary, OutgoingMessage } from '@shared/types'

/** An in-memory mailbox so the UI can be explored without connecting a real account. */

export const DEMO_ID = 'demo'

interface DemoMessage extends MessageDetail {}

const FOLDERS: Folder[] = [
  { path: 'INBOX', name: 'Inbox', delimiter: '/', specialUse: '\\Inbox', depth: 0 },
  { path: 'Flagged', name: 'Priority', delimiter: '/', specialUse: '\\Flagged', depth: 0 },
  { path: 'Sent', name: 'Sent', delimiter: '/', specialUse: '\\Sent', depth: 0 },
  { path: 'Archive', name: 'Archive', delimiter: '/', specialUse: '\\Archive', depth: 0 },
  { path: 'Trash', name: 'Trash', delimiter: '/', specialUse: '\\Trash', depth: 0 },
  { path: 'Missions', name: 'Missions', delimiter: '/', depth: 0 },
  { path: 'Missions/Kepler', name: 'Kepler', delimiter: '/', depth: 1 }
]

const SEED: Array<[string, string, string, string, number, Partial<DemoMessage>?]> = [
  ['Admiral Vance', 'vance@fleetcommand.space', 'Priority orders: rendezvous at Kepler-442b',
    'Captain,\n\nYou are ordered to proceed to Kepler-442b at maximum warp. A diplomatic envoy from the Arcturian Collective awaits. Bring your best negotiators and leave the photon torpedoes armed but cold.\n\nTime is critical. Acknowledge on receipt.\n\n— Adm. R. Vance\nFleet Command, Sector 7', 0.2, { flagged: true }],
  ['Engineering', 'chief.okafor@uss-meridian.ship', 'Warp core recalibration complete',
    'Captain,\n\nThe dilithium matrix has been realigned. We are now running at 104% efficiency, which is either excellent news or a sign that physics is about to file a complaint.\n\nI recommend we avoid sustained warp 9.5 for the next 48 hours while the plasma conduits settle.\n\n— Chief Engineer Okafor', 1.5, { hasAttachments: true, attachments: [{ index: 0, filename: 'core-diagnostics.pdf', contentType: 'application/pdf', size: 482113 }] }],
  ['Dr. Lin Sato', 'sato@medbay.uss-meridian.ship', 'Crew physicals — 3 officers overdue',
    'Captain,\n\nFriendly reminder: Lieutenants Reyes, Park and Moreau have each dodged their physicals for three cycles running. I am prepared to use the Captain\'s authority if you are not.\n\nAlso, please stop drinking the replicator coffee at 0300.\n\n— Dr. Sato, CMO', 3],
  ['Stellar Cartography', 'maps@cartography.fleet.space', 'New nebula charted in the Orion Spur',
    'Hello Captain,\n\nOur long-range sensors have catalogued a previously unknown emission nebula approximately 12 light-years off the starboard bow. Preliminary spectral analysis shows unusual concentrations of ionized helium.\n\nWe propose naming it "The Meridian Veil" pending your approval.\n\nCartography Team', 6],
  ['Quartermaster Bell', 'bell@supply.uss-meridian.ship', 'Re: Shore leave on Risa',
    'Captain,\n\nShore leave rotations are posted. Alpha shift goes first. Please remind the crew that the tribbles are not souvenirs.\n\n— QM Bell', 10],
  ['Arcturian Envoy', 'envoy@arcturus.collective', 'Greetings from the Collective',
    'Honored Captain,\n\nWe look forward to our meeting. Please note that in our culture, a gift of cheese is considered a declaration of war. Please do not bring cheese.\n\nIn peace and harmonic resonance,\nAmbassador Th\'Zaan', 20],
  ['Fleet Academy', 'alumni@academy.fleet.space', 'Your class reunion: 20 years since graduation',
    'Dear Alumnus,\n\nJoin your classmates on Luna Station for an evening of reminiscing, zero-g volleyball, and regrettable karaoke.\n\nRSVP by stardate 4127.3.', 30],
  ['Holodeck Scheduling', 'holodeck@uss-meridian.ship', 'Your reservation: Holodeck 2, 1900 hours',
    'Your program "Detective Noir — 1940s San Francisco" is confirmed. Safety protocols are ENGAGED. (We checked. Twice.)', 48],
  ['Security', 'security@uss-meridian.ship', 'Incident report: unauthorized access to Deck 7',
    'Captain,\n\nAt 0247 hours an unknown individual accessed the cargo bay on Deck 7. Investigation revealed it was Ensign Kowalski attempting to retrieve a misplaced sandwich.\n\nNo further action recommended.\n\n— Lt. Cmdr. Haddad, Security', 72]
]

const now = Date.now()
let nextUid = 100

function make(folder: string, [name, address, subject, text, hoursAgo, extra]: (typeof SEED)[number], i: number): DemoMessage {
  return {
    accountId: DEMO_ID,
    folder,
    uid: nextUid++,
    subject,
    from: { name, address },
    to: [{ name: 'Captain', address: 'captain@uss-meridian.ship' }],
    cc: [],
    replyTo: [],
    date: new Date(now - hoursAgo * 3_600_000).toISOString(),
    seen: i > 3,
    flagged: false,
    hasAttachments: false,
    snippet: text.replace(/\s+/g, ' ').slice(0, 140),
    text,
    attachments: [],
    messageId: `<demo-${i}@starmail>`,
    ...extra
  }
}

const boxes = new Map<string, DemoMessage[]>()
FOLDERS.forEach((f) => boxes.set(f.path, []))
SEED.forEach((s, i) => boxes.get('INBOX')!.push(make('INBOX', s, i)))
boxes.get('Missions/Kepler')!.push(
  make('Missions/Kepler', ['Science Officer T\'Vel', 'tvel@uss-meridian.ship', 'Kepler-442b atmospheric survey',
    'Captain,\n\nAtmosphere is breathable. Fauna is curious. One specimen attempted to adopt Lt. Park.\n\n— T\'Vel', 90], 99)
)

const strip = ({ text: _t, html: _h, cc: _c, replyTo: _r, attachments: _a, messageId: _m, references: _rf, ...s }: DemoMessage): MessageSummary => s

export function folders(): Folder[] {
  return FOLDERS.map((f) => {
    const msgs = f.path === 'Flagged' ? allFlagged() : (boxes.get(f.path) ?? [])
    return { ...f, total: msgs.length, unread: msgs.filter((m) => !m.seen).length }
  })
}

function allFlagged(): DemoMessage[] {
  return [...boxes.values()].flat().filter((m) => m.flagged)
}

function find(folder: string, uid: number): DemoMessage | undefined {
  return [...boxes.values()].flat().find((m) => m.uid === uid && (m.folder === folder || folder === 'Flagged'))
}

export function list(folder: string): ListResult {
  const msgs = folder === 'Flagged' ? allFlagged() : (boxes.get(folder) ?? [])
  const sorted = [...msgs].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  return { messages: sorted.map(strip), total: sorted.length, cursor: 1 }
}

export function search(folder: string, q: string): MessageSummary[] {
  const needle = q.toLowerCase()
  return list(folder).messages.filter((m) =>
    [m.subject, m.from.name, m.from.address, m.snippet].some((s) => s?.toLowerCase().includes(needle))
  )
}

export function get(folder: string, uid: number): MessageDetail {
  const m = find(folder, uid)
  if (!m) throw new Error('Message not found')
  m.seen = true
  return { ...m }
}

export function action(folder: string, uids: number[], act: MessageAction): void {
  for (const uid of uids) {
    const m = find(folder, uid)
    if (!m) continue
    if (act === 'seen' || act === 'unseen') m.seen = act === 'seen'
    else if (act === 'flag' || act === 'unflag') m.flagged = act === 'flag'
    else {
      const target = act === 'trash' ? 'Trash' : act === 'archive' ? 'Archive' : 'Trash'
      const src = boxes.get(m.folder)!
      src.splice(src.indexOf(m), 1)
      if (m.folder === 'Trash' && act === 'trash') continue
      m.folder = target
      boxes.get(target)!.push(m)
    }
  }
}

export function send(msg: OutgoingMessage): void {
  const text = msg.text
  boxes.get('Sent')!.push({
    accountId: DEMO_ID,
    folder: 'Sent',
    uid: nextUid++,
    subject: msg.subject || '(no subject)',
    from: { name: 'Captain', address: 'captain@uss-meridian.ship' },
    to: msg.to.split(',').map((a) => ({ name: '', address: a.trim() })),
    cc: [],
    replyTo: [],
    date: new Date().toISOString(),
    seen: true,
    flagged: false,
    hasAttachments: false,
    snippet: text.slice(0, 140),
    text,
    attachments: []
  })
}
