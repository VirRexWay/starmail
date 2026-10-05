import { type Universe, hhmm, plural, ordinal } from './types'

// ------------------------------------------------------------------ Elven realm (the light)

const MOONS = ['Frostmoon', 'Snowmoon', 'Thawmoon', 'Rainmoon', 'Blossommoon', 'Brightmoon', 'Sunmoon', 'Harvestmoon', 'Goldmoon', 'Leafmoon', 'Mistmoon', 'Starmoon']

function partOfDay(h: number): string {
  if (h < 5) return 'Deep night'
  if (h < 8) return 'Dawn'
  if (h < 12) return 'Morning'
  if (h < 14) return 'Midday'
  if (h < 18) return 'Afternoon'
  if (h < 21) return 'Dusk'
  return 'Evening'
}

export const elven: Universe = {
  id: 'elven',
  group: 'Fantasy',
  name: 'Elven Realm',
  accountColors: ['#e6d7a3', '#9fc6b8', '#b9c8ff', '#f2c86b', '#d8c3f0', '#a9e4dc', '#f4b8a8', '#c7e39a'],
  tagline: 'An ancient forest kingdom under twilight stars. Silver, gold and quiet bells.',
  presets: [
    { id: 'silver-leaf', name: 'Silver Leaf', primary: '#e6d7a3', secondary: '#9fc6b8', alert: '#e07a6a' },
    { id: 'twilight-hall', name: 'Twilight Hall', primary: '#b9c8ff', secondary: '#e6d7a3', alert: '#f08a8a' },
    { id: 'autumn-wood', name: 'Autumn Wood', primary: '#f2c86b', secondary: '#a7d18b', alert: '#e86a5c' },
    { id: 'evening-star', name: 'Evening Star', primary: '#f4f1ff', secondary: '#9db8e8', alert: '#e88b9c' },
    { id: 'river-mist', name: 'River Mist', primary: '#a9e4dc', secondary: '#d8c3f0', alert: '#ef8f7a' }
  ],
  fonts: [
    { id: 'cinzel', name: 'Inscription' },
    { id: 'cinzel-deco', name: 'Illuminated' },
    { id: 'mono', name: 'Plain' }
  ],
  defaultFont: 'cinzel',
  bodyFont: "'EB Garamond', Georgia, serif",
  backgrounds: [
    { id: 'twilight', name: 'Twilight wood' },
    { id: 'starlight', name: 'Starlight' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'twilight',
  scanlines: false,
  boot: {
    title: 'Silverleaf Post',
    subtitle: (v) => `The letters of the ${v}`,
    lines: [
      'The lamps of the hall are kindled',
      'The messengers are called from the wood',
      'Seals are set upon the letters',
      'The stars are marked and the hour is known',
      'All is ready. Be welcome.'
    ],
    hint: 'Press any key to enter'
  },
  clock: (now) => ({
    label: MOONS[now.getMonth()],
    value: `${ordinal(now.getDate())} day`,
    sub: `${partOfDay(now.getHours())} · ${hhmm(now)}`
  }),
  copy: {
    brand: 'Silverleaf Post',
    vessel: (n) => `House of ${n}`,
    uplinks: (n) => plural(n, 'messenger'),
    shipNameLabel: 'House name',
    allChannels: 'All Letters',
    compose: 'Write a Letter',
    searchPlaceholder: 'Seek among the letters…',
    searchLabel: 'Seeking',
    readerLabel: 'Letter',
    idleTitle: 'No letter lies open',
    emptyFolder: 'No letters rest here',
    noResults: 'Nothing was found',
    signalLost: 'The messenger has gone astray',
    loadMore: 'Older letters',
    scanning: 'Seeking',
    decrypting: 'Breaking the seal',
    composeTitle: { new: 'A New Letter', reply: 'Reply', replyAll: 'Reply to All', forward: 'Pass it On' },
    send: 'Send',
    sending: 'On the wind…',
    sendHint: 'Ctrl+Enter to send',
    linkAccount: 'Summon a messenger',
    linkDown: 'The way is shut',
    welcome: 'Be welcome, friend',
    configureKicker: 'The messengers',
    addTitle: 'Summon a messenger',
    simulation: 'A tale',
    channelLabel: 'Name',
    channelColour: 'Colour',
    handshakeOk: 'The messenger returns: both roads are open.',
    settingsKicker: 'The library',
    settingsTitle: 'Hall of Settings',
    viewscreen: 'The sky',
    comms: 'Letters',
    linkedChannels: 'Messengers',
    warpLabel: 'Call the wind',
    warpButton: 'Call',
    kicker: { info: 'Tidings', success: 'It is done', error: 'Ill news', incoming: 'A letter' },
    toast: {
      sent: 'Your letter is on its way',
      sendFailed: 'The letter could not be sent',
      archived: 'Laid in the archive',
      trashed: 'Returned to the earth',
      spam: 'Banished',
      incoming: 'A letter arrives',
      incomingMany: (n) => `${n} letters arrive`,
      linked: 'A new messenger joins you',
      unlinked: 'The messenger departs',
      partialFail: 'Some messengers did not return',
      openFail: 'The letter is unreadable',
      commandFail: 'That could not be done',
      noRecipient: 'To whom?',
      noRecipientBody: 'Name at least one recipient',
      saved: 'Kept safe',
      saveFail: 'It could not be kept'
    }
  }
}
