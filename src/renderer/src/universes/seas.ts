import { type Universe, plural } from './types'

// ------------------------------------------------------------------ High Seas (pirates)

/** Traditional ship's watches and bells: one bell per half hour, eight bells ends a watch. */
function watchOf(h: number): string {
  if (h < 4) return 'Middle watch'
  if (h < 8) return 'Morning watch'
  if (h < 12) return 'Forenoon watch'
  if (h < 16) return 'Afternoon watch'
  if (h < 18) return 'First dog watch'
  if (h < 20) return 'Last dog watch'
  return 'First watch'
}

export const seas: Universe = {
  id: 'seas',
  group: 'Fantasy',
  name: 'High Seas',
  tagline: 'A pirate ship under the moon. Rolling waves, creaking timbers and messages in bottles.',
  accountColors: ['#e8c37a', '#c0392b', '#5aa0a8', '#e8dcc0', '#8e6f4e', '#3f7f5f', '#d98c3f', '#7a8cc0'],
  presets: [
    { id: 'doubloon', name: 'Doubloon', primary: '#e8c37a', secondary: '#5aa0a8', alert: '#d64535' },
    { id: 'black-flag', name: 'Black Flag', primary: '#e8dcc0', secondary: '#c0392b', alert: '#e8c37a' },
    { id: 'reef', name: 'Reef', primary: '#4fd1c5', secondary: '#e8c37a', alert: '#ff6b5a' },
    { id: 'rum-runner', name: 'Rum Runner', primary: '#d98c3f', secondary: '#8e6f4e', alert: '#d64535' },
    { id: 'kraken-ink', name: 'Kraken Ink', primary: '#9b8cff', secondary: '#4fd1c5', alert: '#ff6b5a' }
  ],
  fonts: [
    { id: 'jolly', name: 'Jolly' },
    { id: 'pirata', name: 'Captain\'s hand' },
    { id: 'fell', name: 'Logbook' }
  ],
  defaultFont: 'jolly',
  bodyFont: "'IM Fell English', 'Libre Baskerville', Georgia, serif",
  backgrounds: [
    { id: 'ocean', name: 'Open sea' },
    { id: 'chart', name: 'Sea chart' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'ocean',
  scanlines: false,
  boot: {
    title: 'The Salty Post',
    subtitle: (v) => `Aboard ${v}`,
    lines: [
      'Hoist the colours!',
      'Weigh anchor and trim the sails',
      'Check the bottles for messages',
      'Count the doubloons (again)',
      'All hands on deck, Captain'
    ],
    hint: 'Press any key, ye scallywag'
  },
  clock: (now) => {
    const h = now.getHours()
    const halfHours = Math.floor(((h % 4) * 60 + now.getMinutes()) / 30)
    const bells = halfHours === 0 ? 8 : halfHours
    return { label: watchOf(h), value: plural(bells, 'bell'), sub: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
  },
  copy: {
    brand: 'The Salty Post',
    vessel: (n) => `The ${n}`,
    uplinks: (n) => plural(n, 'harbour'),
    shipNameLabel: 'Ship name',
    allChannels: 'All Bottles',
    compose: 'Write a Message',
    searchPlaceholder: 'Search the hold…',
    searchLabel: 'Searching',
    readerLabel: 'Message',
    idleTitle: 'No bottle opened',
    emptyFolder: 'Nothing but sea water',
    noResults: 'Not a scrap to be found',
    signalLost: 'Lost at sea',
    loadMore: 'Dredge up older bottles',
    scanning: 'Scanning the horizon',
    decrypting: 'Uncorking',
    composeTitle: { new: 'Message in a Bottle', reply: 'Reply', replyAll: 'Reply to the Crew', forward: 'Pass It Along' },
    send: 'Cast Overboard',
    sending: 'Into the waves…',
    sendHint: 'Ctrl+Enter to cast off',
    linkAccount: 'Chart a new harbour',
    linkDown: 'Lost at sea',
    welcome: 'Ahoy, Captain!',
    configureKicker: 'The navigator',
    addTitle: 'Chart a new harbour',
    simulation: 'Ghost ship',
    channelLabel: 'Harbour name',
    channelColour: 'Flag colour',
    handshakeOk: 'Both harbours signal back. IMAP and SMTP are clear.',
    settingsKicker: 'The captain\'s quarters',
    settingsTitle: 'Ship\'s Articles',
    viewscreen: 'The sea',
    comms: 'Bottles',
    linkedChannels: 'Charted harbours',
    warpLabel: 'Fire the cannons',
    warpButton: 'Fire!',
    kicker: { info: 'Ahoy', success: 'Aye', error: 'Blast!', incoming: 'Bottle sighted' },
    toast: {
      sent: 'Bottle cast overboard',
      sendFailed: 'The bottle washed back',
      archived: 'Stowed in the hold',
      trashed: 'Walked the plank',
      spam: 'Thrown to the sharks',
      incoming: 'A bottle washes up',
      incomingMany: (n) => `${n} bottles wash up`,
      linked: 'New harbour charted',
      unlinked: 'Harbour abandoned',
      partialFail: 'Some harbours went quiet',
      openFail: 'The message is waterlogged',
      commandFail: 'The crew refused',
      noRecipient: 'No destination',
      noRecipientBody: 'Name at least one port of call',
      saved: 'Treasure stowed',
      saveFail: 'The treasure sank'
    }
  }
}
