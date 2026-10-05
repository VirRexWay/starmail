import { type Universe, dayOfYear, plural } from './types'

// ------------------------------------------------------------------ Starship

export const starship: Universe = {
  id: 'starship',
  group: 'Space',
  name: 'Starship',
  accountColors: ['#3ef0ff', '#ff6ec7', '#ffb347', '#39ff88', '#c77dff', '#ff4d6d', '#8ab4f8', '#ffe066'],
  tagline: 'Command bridge of a deep-space explorer. Neon HUD, warp drive, synth bleeps.',
  presets: [
    { id: 'cyan-command', name: 'Cyan Command', primary: '#3ef0ff', secondary: '#7b8cff', alert: '#ff4d6d' },
    { id: 'lcars-amber', name: 'Amber Console', primary: '#ffb347', secondary: '#cc99ff', alert: '#ff6666' },
    { id: 'red-alert', name: 'Red Alert', primary: '#ff4141', secondary: '#ff9f43', alert: '#ffd166' },
    { id: 'nebula-violet', name: 'Nebula Violet', primary: '#c77dff', secondary: '#ff6ec7', alert: '#ffd166' },
    { id: 'emerald-matrix', name: 'Emerald Matrix', primary: '#39ff88', secondary: '#00d4aa', alert: '#ff5e5e' },
    { id: 'ice-station', name: 'Ice Station', primary: '#dff6ff', secondary: '#8ab4f8', alert: '#ff6b6b' },
    { id: 'solar-flare', name: 'Solar Flare', primary: '#ffe066', secondary: '#ff7b54', alert: '#ff3d7f' }
  ],
  fonts: [
    { id: 'orbitron', name: 'Orbitron' },
    { id: 'rajdhani', name: 'Rajdhani' },
    { id: 'exo', name: 'Exo' },
    { id: 'mono', name: 'Terminal' }
  ],
  defaultFont: 'orbitron',
  bodyFont: "'Exo 2', 'Rajdhani', sans-serif",
  backgrounds: [
    { id: 'starfield', name: 'Stars' },
    { id: 'warp', name: 'Warp' },
    { id: 'nebula', name: 'Nebula' },
    { id: 'grid', name: 'Grid' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'starfield',
  scanlines: true,
  boot: {
    title: 'STARMAIL',
    subtitle: (v) => `${v} — COMMUNICATIONS`,
    lines: [
      'INITIALIZING SUBSPACE TRANSCEIVER ........ OK',
      'CALIBRATING LONG-RANGE COMMS ARRAY ....... OK',
      'LOADING ENCRYPTION MATRIX ................ OK',
      'SYNCHRONIZING FLEET TIME ................. OK',
      'ESTABLISHING UPLINKS ..................... OK'
    ],
    hint: 'PRESS ANY KEY'
  },
  clock: (now) => ({
    label: 'STARDATE',
    value: ((now.getFullYear() - 2000) * 1000 + (dayOfYear(now) / 365) * 1000).toFixed(1),
    sub: now.toLocaleTimeString([], { hour12: false })
  }),
  copy: {
    brand: 'STARMAIL',
    vessel: (n) => `U.S.S. ${n.toUpperCase()}`,
    uplinks: (n) => plural(n, 'UPLINK'),
    shipNameLabel: 'Ship name',
    allChannels: 'All Channels',
    compose: 'COMPOSE',
    searchPlaceholder: 'Scan transmissions…',
    searchLabel: 'SEARCH',
    readerLabel: 'TRANSMISSION',
    idleTitle: 'AWAITING TRANSMISSION',
    emptyFolder: 'SECTOR CLEAR',
    noResults: 'NO MATCHING TRANSMISSIONS',
    signalLost: 'SIGNAL LOST',
    loadMore: 'LOAD OLDER TRANSMISSIONS',
    scanning: 'SCANNING',
    decrypting: 'DECRYPTING',
    composeTitle: { new: 'NEW TRANSMISSION', reply: 'REPLY', replyAll: 'REPLY ALL', forward: 'RELAY' },
    send: 'TRANSMIT',
    sending: 'CHARGING…',
    sendHint: 'CTRL+ENTER TO TRANSMIT',
    linkAccount: 'Link new account',
    linkDown: 'LINK DOWN',
    welcome: 'WELCOME ABOARD, CAPTAIN',
    configureKicker: 'COMMS CONFIGURATION',
    addTitle: 'Link a communications channel',
    simulation: 'Simulation',
    channelLabel: 'Channel label',
    channelColour: 'Channel colour',
    handshakeOk: 'Handshake confirmed. IMAP and SMTP links are green.',
    settingsKicker: 'BRIDGE CONFIGURATION',
    settingsTitle: 'Ship Systems',
    viewscreen: 'Viewscreen',
    comms: 'Communications',
    linkedChannels: 'Linked channels',
    warpLabel: 'Test warp drive',
    warpButton: 'ENGAGE',
    kicker: { info: 'NOTICE', success: 'CONFIRMED', error: 'ALERT', incoming: 'INCOMING' },
    toast: {
      sent: 'Transmission sent',
      sendFailed: 'Transmission failed',
      archived: 'Archived',
      trashed: 'Jettisoned',
      spam: 'Quarantined',
      incoming: 'Incoming transmission',
      incomingMany: (n) => `${n} incoming transmissions`,
      linked: 'Uplink established',
      unlinked: 'Channel unlinked',
      partialFail: 'Partial sensor failure',
      openFail: 'Transmission corrupted',
      commandFail: 'Command failed',
      noRecipient: 'No destination',
      noRecipientBody: 'Add at least one recipient',
      saved: 'Cargo transferred',
      saveFail: 'Transfer failed'
    }
  }
}
