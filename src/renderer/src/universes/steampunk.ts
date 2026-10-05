import { type Universe, pad, plural } from './types'

// ------------------------------------------------------------------ Steampunk Telegraph

export const steampunk: Universe = {
  id: 'steampunk',
  group: 'Atmosphere',
  name: 'Steampunk Telegraph',
  tagline: 'Brass, steam and turning gears. Messages fired across the city by pneumatic tube.',
  accountColors: ['#d4a24c', '#b87333', '#8fb3a0', '#c9b27c', '#a0522d', '#7a9cc6', '#e0c088', '#9c6b8f'],
  presets: [
    { id: 'polished-brass', name: 'Polished Brass', primary: '#d4a24c', secondary: '#b87333', alert: '#c0392b' },
    { id: 'verdigris', name: 'Verdigris', primary: '#7fb8a4', secondary: '#c49a52', alert: '#c0392b' },
    { id: 'copper-kettle', name: 'Copper Kettle', primary: '#e08850', secondary: '#c9b27c', alert: '#a02020' },
    { id: 'gaslight', name: 'Gaslight', primary: '#f2d27a', secondary: '#8a6f4a', alert: '#d04a2a' },
    { id: 'iron-works', name: 'Iron Works', primary: '#b0a898', secondary: '#d4a24c', alert: '#c0392b' }
  ],
  fonts: [
    { id: 'fell', name: 'Broadsheet' },
    { id: 'rye', name: 'Showbill' },
    { id: 'mono', name: 'Ticker tape' }
  ],
  defaultFont: 'fell',
  bodyFont: "'Libre Baskerville', Georgia, serif",
  backgrounds: [
    { id: 'clockwork', name: 'Clockwork' },
    { id: 'skyport', name: 'Skyport' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'clockwork',
  scanlines: false,
  boot: {
    title: 'The Brass Telegraph Co.',
    subtitle: (v) => `Telegraphic office of ${v}`,
    lines: [
      'Stoking the boilers ................ 40 psi',
      'Winding the mainspring ............. taut',
      'Pressurising pneumatic tubes ....... sealed',
      'Tapping the telegraph key .......... · · ·  — — —  · · ·',
      'The office is open for business'
    ],
    hint: 'Press any key, if you please'
  },
  clock: (now) => {
    const h = now.getHours() % 12 || 12
    const psi = 38 + 4 * Math.sin(now.getTime() / 7000) + 2 * Math.sin(now.getTime() / 1700)
    return {
      label: 'Chronometer',
      value: `${h}:${pad(now.getMinutes())} ${now.getHours() < 12 ? 'a.m.' : 'p.m.'}`,
      sub: `Boiler at ${psi.toFixed(1)} psi`
    }
  },
  copy: {
    brand: 'The Brass Telegraph Co.',
    vessel: (n) => `The ${n} Works`,
    uplinks: (n) => plural(n, 'wire'),
    shipNameLabel: 'Workshop name',
    allChannels: 'All Telegrams',
    compose: 'Compose Telegram',
    searchPlaceholder: 'Search the ledger…',
    searchLabel: 'Ledger search',
    readerLabel: 'Telegram',
    idleTitle: 'No telegram on the desk',
    emptyFolder: 'The pigeonholes are empty',
    noResults: 'No entry in the ledger',
    signalLost: 'The line has gone dead',
    loadMore: 'Fetch older telegrams',
    scanning: 'Consulting the ledger',
    decrypting: 'Unsealing the capsule',
    composeTitle: { new: 'New Telegram', reply: 'Reply by Wire', replyAll: 'Reply to All Parties', forward: 'Relay Telegram' },
    send: 'Dispatch by Tube',
    sending: 'Building pressure…',
    sendHint: 'Ctrl+Enter to dispatch',
    linkAccount: 'String a new wire',
    linkDown: 'Line dead',
    welcome: 'Welcome to the office',
    configureKicker: 'Wire installation',
    addTitle: 'String a new wire',
    simulation: 'Demonstration model',
    channelLabel: 'Wire name',
    channelColour: 'Enamel colour',
    handshakeOk: 'Both wires hum true: IMAP and SMTP are connected.',
    settingsKicker: 'The engine room',
    settingsTitle: 'Adjustments & Regulators',
    viewscreen: 'The window',
    comms: 'Telegraphy',
    linkedChannels: 'Strung wires',
    warpLabel: 'Open the pressure valve',
    warpButton: 'Full steam',
    kicker: { info: 'Notice', success: 'Dispatched', error: 'Malfunction', incoming: 'Telegram' },
    toast: {
      sent: 'Telegram dispatched by tube',
      sendFailed: 'The tube jammed',
      archived: 'Filed in the ledger',
      trashed: 'Fed to the furnace',
      spam: 'Stamped "Rejected"',
      incoming: 'A telegram has arrived',
      incomingMany: (n) => `${n} telegrams have arrived`,
      linked: 'New wire strung',
      unlinked: 'Wire cut',
      partialFail: 'Some lines are down',
      openFail: 'The capsule is damaged',
      commandFail: 'The mechanism seized',
      noRecipient: 'No addressee',
      noRecipientBody: 'A telegram requires at least one recipient',
      saved: 'Parcel collected',
      saveFail: 'Parcel lost in transit'
    }
  }
}
