import { type Universe, pad, plural } from './types'

// ------------------------------------------------------------------ Eldritch (cosmic horror)

const OMENS = ['it is closer now', 'do not look behind you', 'the stars are nearly right', 'you hear it too', 'the tide is rising', 'something is listening', 'it knows your name']

export const eldritch: Universe = {
  id: 'eldritch',
  group: 'Atmosphere',
  name: 'Eldritch',
  tagline: 'Something vast stirs beneath the fog. Your inbox has been waiting for you. For a long time.',
  accountColors: ['#7fbf9f', '#9f7fbf', '#bfaf7f', '#5f9faf', '#af5f6f', '#8f9f5f', '#6f7faf', '#bf8f6f'],
  presets: [
    { id: 'drowned', name: 'Drowned', primary: '#7fbf9f', secondary: '#4f7f8f', alert: '#bf4f4f' },
    { id: 'pale-king', name: 'Pale Yellow', primary: '#d8c87a', secondary: '#8a7a4a', alert: '#bf4f4f' },
    { id: 'abyss', name: 'Abyss', primary: '#8f7fd8', secondary: '#4f8f8f', alert: '#d85f6f' },
    { id: 'bone', name: 'Bone', primary: '#d8d0c0', secondary: '#7a8a7a', alert: '#a03030' },
    { id: 'bioluminescent', name: 'Bioluminescent', primary: '#5fe8c8', secondary: '#7f5fd8', alert: '#e85f7f' }
  ],
  fonts: [
    { id: 'pica', name: 'Old Print' },
    { id: 'grenze', name: 'Grimoire' },
    { id: 'mono', name: 'Plain' }
  ],
  defaultFont: 'pica',
  bodyFont: "'Crimson Text', Georgia, serif",
  backgrounds: [
    { id: 'fog', name: 'The fog' },
    { id: 'void', name: 'The void' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'fog',
  scanlines: false,
  boot: {
    title: 'Whispers',
    subtitle: (v) => `Correspondence of ${v}`,
    lines: ['The candles gutter', 'The pages turn by themselves', 'Something writes back', 'You should not have opened this', 'Read on'],
    hint: 'press any key. it is already too late.'
  },
  clock: (now) => {
    const toMidnight = 24 * 60 - (now.getHours() * 60 + now.getMinutes())
    return { label: 'It wakes in', value: `${Math.floor(toMidnight / 60)}:${pad(toMidnight % 60)}`, sub: OMENS[now.getMinutes() % OMENS.length] }
  },
  copy: {
    brand: 'Whispers',
    vessel: (n) => `The ${n} Manor`,
    uplinks: (n) => plural(n, 'voice'),
    shipNameLabel: 'Manor name',
    allChannels: 'All Whispers',
    compose: 'Answer the Call',
    searchPlaceholder: 'Search what should stay buried…',
    searchLabel: 'Seeking',
    readerLabel: 'Missive',
    idleTitle: 'The page is blank. For now.',
    emptyFolder: 'Silence. Too much silence.',
    noResults: 'Nothing answered',
    signalLost: 'The voice fell silent',
    loadMore: 'Dig deeper',
    scanning: 'Listening',
    decrypting: 'Deciphering',
    composeTitle: { new: 'A Missive', reply: 'Answer', replyAll: 'Answer Them All', forward: 'Spread the Word' },
    send: 'Release',
    sending: 'It is carried away…',
    sendHint: 'Ctrl+Enter to release',
    linkAccount: 'Summon another voice',
    linkDown: 'The voice is silent',
    welcome: 'You were expected',
    configureKicker: 'The ritual',
    addTitle: 'Summon another voice',
    simulation: 'A dream',
    channelLabel: 'True name',
    channelColour: 'Sigil colour',
    handshakeOk: 'Both voices answer. IMAP and SMTP are bound.',
    settingsKicker: 'The forbidden library',
    settingsTitle: 'Rites & Observances',
    viewscreen: 'The fog',
    comms: 'Whispers',
    linkedChannels: 'Bound voices',
    warpLabel: 'Wake it',
    warpButton: 'Wake',
    kicker: { info: 'A whisper', success: 'It is done', error: 'It went wrong', incoming: 'Something arrives' },
    toast: {
      sent: 'Released into the dark',
      sendFailed: 'It came back',
      archived: 'Sealed in the archive',
      trashed: 'Given to the deep',
      spam: 'Banished',
      incoming: 'Something writes to you',
      incomingMany: (n) => `${n} things write to you`,
      linked: 'A new voice joins the chorus',
      unlinked: 'A voice falls silent',
      partialFail: 'Some voices did not answer',
      openFail: 'The words will not stay still',
      commandFail: 'It resisted',
      noRecipient: 'No one to receive it',
      noRecipientBody: 'Name at least one recipient',
      saved: 'Taken from the deep',
      saveFail: 'It slipped away'
    }
  }
}
