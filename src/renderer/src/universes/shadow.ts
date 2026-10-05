import { type Universe, hhmm, plural, roman } from './types'

// ------------------------------------------------------------------ Shadow realm (the dark)

export const shadow: Universe = {
  id: 'shadow',
  group: 'Fantasy',
  name: 'Shadow Realm',
  accountColors: ['#ff6a2b', '#d8c24a', '#c9bfb5', '#e0332f', '#8dff6a', '#b07ad9', '#ff9a3d', '#7fb0c9'],
  tagline: 'An iron fortress beneath a burning sky. Embers, war drums and ravens.',
  presets: [
    { id: 'molten', name: 'Molten', primary: '#ff6a2b', secondary: '#c9302c', alert: '#ffcf4a' },
    { id: 'blood-iron', name: 'Blood & Iron', primary: '#e0332f', secondary: '#9a8f86', alert: '#ffb02e' },
    { id: 'sulphur', name: 'Sulphur', primary: '#d8c24a', secondary: '#c4531f', alert: '#ff4a3d' },
    { id: 'ashen', name: 'Ashen', primary: '#c9bfb5', secondary: '#d4492b', alert: '#ff7a3d' },
    { id: 'witchfire', name: 'Witchfire', primary: '#8dff6a', secondary: '#4ab35a', alert: '#ff5a3d' }
  ],
  fonts: [
    { id: 'pirata', name: 'Ironhand' },
    { id: 'fraktur', name: 'Blackletter' },
    { id: 'mono', name: 'Plain' }
  ],
  defaultFont: 'pirata',
  bodyFont: "'Alegreya', Georgia, serif",
  backgrounds: [
    { id: 'embers', name: 'The Forge' },
    { id: 'ashfall', name: 'Ashfall' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'embers',
  scanlines: false,
  boot: {
    title: 'The Iron Courier',
    subtitle: (v) => `Dispatches of ${v}`,
    lines: [
      'THE FORGES ARE LIT',
      'THE RAVENS ARE LOOSED',
      'THE SEALS ARE BROKEN',
      'THE SPIES REPORT',
      'ALL ANSWER TO YOU'
    ],
    hint: 'STRIKE ANY KEY'
  },
  clock: (now) => ({
    label: 'HOUR OF SHADOW',
    value: roman(now.getHours() % 12 || 12),
    sub: `${now.getHours() < 12 ? 'BEFORE THE FIRE' : 'AFTER THE FIRE'} · ${hhmm(now)}`
  }),
  copy: {
    brand: 'The Iron Courier',
    vessel: (n) => `Fortress ${n}`,
    uplinks: (n) => plural(n, 'spy', 'spies'),
    shipNameLabel: 'Stronghold name',
    allChannels: 'All Dispatches',
    compose: 'Issue Decree',
    searchPlaceholder: 'Hunt the dispatches…',
    searchLabel: 'HUNTING',
    readerLabel: 'Dispatch',
    idleTitle: 'No dispatch lies before you',
    emptyFolder: 'Nothing stirs',
    noResults: 'Nothing was found… this time',
    signalLost: 'The raven did not return',
    loadMore: 'Dredge up older dispatches',
    scanning: 'Hunting',
    decrypting: 'Breaking the seal',
    composeTitle: { new: 'A New Decree', reply: 'Answer', replyAll: 'Answer All', forward: 'Send Onward' },
    send: 'Dispatch',
    sending: 'The riders depart…',
    sendHint: 'Ctrl+Enter to dispatch',
    linkAccount: 'Bind a new spy',
    linkDown: 'The spy is silent',
    welcome: 'You have been summoned',
    configureKicker: 'The spymaster',
    addTitle: 'Bind a new spy',
    simulation: 'A war game',
    channelLabel: 'Name',
    channelColour: 'Banner colour',
    handshakeOk: 'The spy answers on both roads. IMAP and SMTP obey.',
    settingsKicker: 'The forge',
    settingsTitle: 'Dark Arts',
    viewscreen: 'The sky',
    comms: 'Dispatches',
    linkedChannels: 'Bound spies',
    warpLabel: 'Stoke the forge',
    warpButton: 'Stoke',
    kicker: { info: 'Word', success: 'It is done', error: 'Failure', incoming: 'A raven' },
    toast: {
      sent: 'The riders have gone',
      sendFailed: 'The riders were turned back',
      archived: 'Locked in the vault',
      trashed: 'Burned',
      spam: 'Thrown into the pit',
      incoming: 'A raven arrives',
      incomingMany: (n) => `${n} ravens arrive`,
      linked: 'A new spy reports in',
      unlinked: 'The spy is released',
      partialFail: 'Some spies are silent',
      openFail: 'The dispatch is unreadable',
      commandFail: 'Your will was not done',
      noRecipient: 'To whom?',
      noRecipientBody: 'Name at least one recipient',
      saved: 'Taken as spoils',
      saveFail: 'The spoils were lost'
    }
  }
}
