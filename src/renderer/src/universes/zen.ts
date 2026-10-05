import { type Universe, hhmm, plural } from './types'

// ------------------------------------------------------------------ Zen Garden

const SEASONS = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter']
const PHASES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']

/** Approximate moon phase from a known new moon (6 Jan 2000) and the synodic month. */
function moonPhase(d: Date): string {
  const synodic = 29.530588853
  const days = (d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86_400_000
  const age = ((days % synodic) + synodic) % synodic
  return PHASES[Math.round((age / synodic) * 8) % 8]
}

export const zen: Universe = {
  id: 'zen',
  group: 'Atmosphere',
  light: true,
  name: 'Zen Garden',
  tagline: 'The quiet one. Koi in a still pond, raked sand, paper screens. No glow, no hurry.',
  accountColors: ['#c0563a', '#5a7a4a', '#3a5a7a', '#a08a5a', '#7a5a7a', '#4a7a7a', '#b08050', '#6a6a6a'],
  presets: [
    { id: 'moss', name: 'Moss', primary: '#4f6f45', secondary: '#a08a5a', alert: '#b8483a' },
    { id: 'vermilion', name: 'Vermilion', primary: '#b8483a', secondary: '#4f6f45', alert: '#b8483a' },
    { id: 'indigo-ink', name: 'Indigo Ink', primary: '#34507a', secondary: '#8a7a5a', alert: '#b8483a' },
    { id: 'cherry', name: 'Cherry Blossom', primary: '#a85a72', secondary: '#6a7a5a', alert: '#b8483a' },
    { id: 'charcoal', name: 'Charcoal', primary: '#3a3a3a', secondary: '#8a8270', alert: '#b8483a' }
  ],
  fonts: [
    { id: 'mincho', name: 'Brush' },
    { id: 'quicksand', name: 'Soft' },
    { id: 'mono', name: 'Plain' }
  ],
  defaultFont: 'mincho',
  bodyFont: "'Quicksand', 'Segoe UI', sans-serif",
  backgrounds: [
    { id: 'koi', name: 'Koi pond' },
    { id: 'sand', name: 'Raked sand' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'koi',
  scanlines: false,
  boot: {
    title: 'Stillwater',
    subtitle: (v) => `${v} · 静`,
    lines: ['Breathe in', 'Breathe out', 'The water is still', 'Your mail can wait a moment', 'Begin'],
    hint: 'press any key, when you are ready'
  },
  clock: (now) => ({ label: SEASONS[now.getMonth()], value: hhmm(now), sub: moonPhase(now) }),
  copy: {
    brand: 'Stillwater',
    vessel: (n) => `${n} Garden`,
    uplinks: (n) => plural(n, 'path'),
    shipNameLabel: 'Garden name',
    allChannels: 'All letters',
    compose: 'Write',
    searchPlaceholder: 'Search, gently…',
    searchLabel: 'Searching',
    readerLabel: 'Letter',
    idleTitle: 'Nothing open. Enjoy the quiet.',
    emptyFolder: 'Empty, like a clear mind',
    noResults: 'Nothing found',
    signalLost: 'The path is blocked',
    loadMore: 'Older letters',
    scanning: 'Searching',
    decrypting: 'Opening',
    composeTitle: { new: 'New letter', reply: 'Reply', replyAll: 'Reply to all', forward: 'Pass along' },
    send: 'Send',
    sending: 'Sending…',
    sendHint: 'Ctrl+Enter to send',
    linkAccount: 'Add a path',
    linkDown: 'Path blocked',
    welcome: 'Welcome. Take your time.',
    configureKicker: 'A new path',
    addTitle: 'Add a path',
    simulation: 'A practice garden',
    channelLabel: 'Name',
    channelColour: 'Colour',
    handshakeOk: 'Both paths are clear. IMAP and SMTP are connected.',
    settingsKicker: 'Tending the garden',
    settingsTitle: 'Settings',
    viewscreen: 'The garden',
    comms: 'Letters',
    linkedChannels: 'Paths',
    warpLabel: 'Drop a pebble',
    warpButton: 'Drop',
    kicker: { info: 'Note', success: 'Done', error: 'A pause', incoming: 'A letter' },
    toast: {
      sent: 'Sent',
      sendFailed: 'It did not send. Try again.',
      archived: 'Put away',
      trashed: 'Let go',
      spam: 'Swept aside',
      incoming: 'A letter arrives',
      incomingMany: (n) => `${n} letters arrive`,
      linked: 'Path added',
      unlinked: 'Path removed',
      partialFail: 'Some paths are blocked',
      openFail: 'This letter could not be opened',
      commandFail: 'That did not work',
      noRecipient: 'To whom?',
      noRecipientBody: 'Add at least one recipient',
      saved: 'Saved',
      saveFail: 'Could not save'
    }
  }
}
