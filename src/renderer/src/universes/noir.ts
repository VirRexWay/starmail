import { type Universe, plural } from './types'

// ------------------------------------------------------------------ Noir detective

const MOODS = ['still raining', 'the coffee went cold', 'the city never sleeps', 'nobody is innocent', 'another long night', 'the phone keeps ringing']

function partOfNight(h: number): string {
  if (h < 5) return 'small hours'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

export const noir: Universe = {
  id: 'noir',
  group: 'Atmosphere',
  name: 'Noir',
  tagline: 'Rain on the office window, a flickering neon sign and a stack of case files. Black and white, mostly.',
  accountColors: ['#e8e2d4', '#c23b3b', '#9a9a9a', '#d4a24c', '#6a8caf', '#b07070', '#c8c8b0', '#7a9a7a'],
  presets: [
    { id: 'silver-screen', name: 'Silver Screen', primary: '#e8e2d4', secondary: '#9a958a', alert: '#c23b3b' },
    { id: 'lipstick', name: 'Lipstick', primary: '#d9534f', secondary: '#e8e2d4', alert: '#f0c040' },
    { id: 'neon-motel', name: 'Neon Motel', primary: '#ff5a8a', secondary: '#7ad7f0', alert: '#f0c040' },
    { id: 'whiskey', name: 'Whiskey', primary: '#d4a24c', secondary: '#8a7a6a', alert: '#c23b3b' },
    { id: 'blue-hour', name: 'Blue Hour', primary: '#8fb0d9', secondary: '#c8c0b0', alert: '#d9534f' }
  ],
  fonts: [
    { id: 'elite', name: 'Typewriter' },
    { id: 'limelight', name: 'Marquee' },
    { id: 'mono', name: 'Teletype' }
  ],
  defaultFont: 'elite',
  bodyFont: "'Courier Prime', 'Courier New', monospace",
  backgrounds: [
    { id: 'rainwindow', name: 'Rainy window' },
    { id: 'blinds', name: 'Venetian blinds' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'rainwindow',
  scanlines: false,
  boot: {
    title: 'Midnight Investigations',
    subtitle: (v) => `The offices of ${v}`,
    lines: [
      'It was a dark night. It always is.',
      'The rain hit the window like it owed me money.',
      'The mail was piled up on the desk.',
      'Somewhere in there was the truth.',
      'I poured a coffee and started reading.'
    ],
    hint: 'press any key, sweetheart'
  },
  clock: (now) => ({
    label: `${now.toLocaleDateString([], { weekday: 'long' })} ${partOfNight(now.getHours())}`,
    value: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    sub: MOODS[now.getHours() % MOODS.length]
  }),
  copy: {
    brand: 'Midnight Investigations',
    vessel: (n) => `${n} & Associates`,
    uplinks: (n) => plural(n, 'line'),
    shipNameLabel: 'Agency name',
    allChannels: 'All Case Files',
    compose: 'Write it up',
    searchPlaceholder: 'Look for clues…',
    searchLabel: 'Clues',
    readerLabel: 'Case file',
    idleTitle: 'No case on the desk',
    emptyFolder: 'Nothing here but dust',
    noResults: 'No leads. Not yet.',
    signalLost: 'The line went dead',
    loadMore: 'Dig up cold cases',
    scanning: 'Following leads',
    decrypting: 'Reading between the lines',
    composeTitle: { new: 'New Letter', reply: 'Reply', replyAll: 'Reply to Everyone Involved', forward: 'Pass It Along' },
    send: 'Mail it',
    sending: 'Licking the stamp…',
    sendHint: 'Ctrl+Enter to mail it',
    linkAccount: 'Get a new line',
    linkDown: 'Line dead',
    welcome: 'Come in. Sit down.',
    configureKicker: 'New line',
    addTitle: 'Get a new line',
    simulation: 'An old case',
    channelLabel: 'Name on the door',
    channelColour: 'Ink colour',
    handshakeOk: 'Both lines answered. IMAP and SMTP check out.',
    settingsKicker: 'The office',
    settingsTitle: 'House Rules',
    viewscreen: 'Out the window',
    comms: 'The mail',
    linkedChannels: 'Open lines',
    warpLabel: 'Lightning',
    warpButton: 'Strike',
    kicker: { info: 'A note', success: 'Case closed', error: 'Trouble', incoming: 'The phone rings' },
    toast: {
      sent: 'Letter in the mailbox',
      sendFailed: 'Returned to sender',
      archived: 'Filed away',
      trashed: 'Burned the evidence',
      spam: 'Tossed it in the gutter',
      incoming: 'Somebody wrote',
      incomingMany: (n) => `${n} letters under the door`,
      linked: 'New line connected',
      unlinked: 'Line disconnected',
      partialFail: 'Some lines went quiet',
      openFail: 'The ink ran in the rain',
      commandFail: "It didn't work out",
      noRecipient: 'Addressed to nobody',
      noRecipientBody: 'Put a name on the envelope',
      saved: 'Bagged as evidence',
      saveFail: 'The evidence got lost'
    }
  }
}
