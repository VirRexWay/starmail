import { type Universe, pad, hhmm, dayOfYear, plural } from './types'

// ------------------------------------------------------------------ Frontier (space western)

export const frontier: Universe = {
  id: 'frontier',
  group: 'Space',
  name: 'Frontier',
  accountColors: ['#e8a84a', '#9fd3c7', '#e0654a', '#c9a227', '#b98fd1', '#7aa6d9', '#d9c18f', '#8fbf6a'],
  tagline: 'A battered little transport working the edge of the system. Worn metal, dust and a guitar.',
  presets: [
    { id: 'rust-bucket', name: 'Rust Bucket', primary: '#e8a84a', secondary: '#c9643b', alert: '#e5484d' },
    { id: 'dust-devil', name: 'Dust Devil', primary: '#d9c18f', secondary: '#9a7a54', alert: '#e0654a' },
    { id: 'border-moon', name: 'Border Moon', primary: '#9fd3c7', secondary: '#e8a84a', alert: '#e5484d' },
    { id: 'red-sand', name: 'Red Sand', primary: '#f07b4f', secondary: '#f2c46d', alert: '#ffd166' },
    { id: 'old-brass', name: 'Old Brass', primary: '#c9a227', secondary: '#7a9e7e', alert: '#d9534f' }
  ],
  fonts: [
    { id: 'stencil', name: 'Hull Stencil' },
    { id: 'rye', name: 'Saloon' },
    { id: 'mono', name: 'Terminal' }
  ],
  defaultFont: 'stencil',
  bodyFont: "'Barlow', 'Microsoft YaHei', sans-serif",
  backgrounds: [
    { id: 'frontier', name: 'Horizon' },
    { id: 'drift', name: 'Drift' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'frontier',
  scanlines: true,
  boot: {
    title: 'LONGWAVE',
    subtitle: (v) => `${v} · 通讯`,
    lines: [
      'SPINNING UP PULSE BEACON .................. OK',
      'KICKING THE GRAV BOOT ..................... MOSTLY OK',
      'LISTENING FOR LAWMEN ON THE BAND .......... CLEAR',
      'ROUTING THROUGH BACK-CHANNEL RELAYS ....... OK',
      'TUNING IN THE CREW ........................ SHINY'
    ],
    hint: 'HIT ANY KEY · 按任意键'
  },
  clock: (now) => ({
    label: 'SHIP TIME · 时间',
    value: `DAY ${pad(dayOfYear(now))}`,
    sub: hhmm(now) + ' LOCAL'
  }),
  copy: {
    brand: 'LONGWAVE',
    vessel: (n) => `TRANSPORT ${n.toUpperCase()}`,
    uplinks: (n) => plural(n, 'BAND'),
    shipNameLabel: 'Ship name',
    allChannels: 'All Bands',
    compose: 'SEND WAVE',
    searchPlaceholder: 'Search the black…',
    searchLabel: 'SEARCH',
    readerLabel: 'WAVE',
    idleTitle: 'NOTHING ON THE BAND',
    emptyFolder: 'QUIET OUT HERE',
    noResults: 'NOTHING MATCHES',
    signalLost: 'LOST THE SIGNAL',
    loadMore: 'DIG UP OLDER WAVES',
    scanning: 'LISTENING',
    decrypting: 'TUNING IN',
    composeTitle: { new: 'NEW WAVE', reply: 'WAVE BACK', replyAll: 'WAVE THE CREW', forward: 'PASS IT ON' },
    send: 'SEND WAVE',
    sending: 'BROADCASTING…',
    sendHint: 'CTRL+ENTER TO SEND',
    linkAccount: 'Open a new band',
    linkDown: 'NO SIGNAL',
    welcome: 'WELCOME ABOARD',
    configureKicker: 'COMMS RIG',
    addTitle: 'Open a new band',
    simulation: 'Practice Run',
    channelLabel: 'Band name',
    channelColour: 'Band colour',
    handshakeOk: 'Got a clear signal both ways. IMAP and SMTP are good to go.',
    settingsKicker: 'ENGINE ROOM · 机房',
    settingsTitle: 'Ship Settings',
    viewscreen: 'Out the window',
    comms: 'Comms',
    linkedChannels: 'Open bands',
    warpLabel: 'Test the burn',
    warpButton: 'FULL BURN',
    kicker: { info: 'WORD', success: 'SHINY', error: 'TROUBLE', incoming: 'WAVE' },
    toast: {
      sent: 'Wave sent',
      sendFailed: "Wave didn't make it",
      archived: 'Stowed in the hold',
      trashed: 'Spaced',
      spam: 'Tossed out the airlock',
      incoming: 'Incoming wave',
      incomingMany: (n) => `${n} waves came in`,
      linked: "Band's open",
      unlinked: 'Band closed',
      partialFail: 'Some bands went quiet',
      openFail: 'Wave came through garbled',
      commandFail: "That didn't take",
      noRecipient: 'Nobody to send to',
      noRecipientBody: 'Put somebody in the To line',
      saved: 'Cargo unloaded',
      saveFail: 'Cargo got stuck'
    },
    accent: { list: '收件', reader: '信息', compose: '发送', all: '全部' }
  }
}
