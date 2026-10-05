import { type Universe, pad, plural } from './types'

// ------------------------------------------------------------------ Digital Rain

export const rain: Universe = {
  id: 'rain',
  group: 'Digital',
  name: 'Digital Rain',
  tagline: 'The world behind the world. Falling green code, glitching signals, nothing is what it seems.',
  accountColors: ['#00ff66', '#7dffb2', '#00d4ff', '#c8ff00', '#ffffff', '#ff3366', '#66ffcc', '#b3ff66'],
  presets: [
    { id: 'phosphor', name: 'Phosphor', primary: '#00ff66', secondary: '#9dffc4', alert: '#ff3366' },
    { id: 'deep-code', name: 'Deep Code', primary: '#39ff14', secondary: '#0aa34a', alert: '#ff2a2a' },
    { id: 'ice-code', name: 'Ice Code', primary: '#00e5ff', secondary: '#7df9ff', alert: '#ff3e8a' },
    { id: 'red-signal', name: 'Red Signal', primary: '#ff2a4a', secondary: '#ff8a9a', alert: '#00ff66' },
    { id: 'gold-code', name: 'Gold Code', primary: '#ffd000', secondary: '#ffe98a', alert: '#ff3366' }
  ],
  fonts: [
    { id: 'mono', name: 'Code' },
    { id: 'vt323', name: 'Phosphor' },
    { id: 'plex', name: 'System' }
  ],
  defaultFont: 'mono',
  bodyFont: "'IBM Plex Mono', 'Share Tech Mono', monospace",
  backgrounds: [
    { id: 'rain', name: 'Rain' },
    { id: 'cascade', name: 'Cascade' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'rain',
  scanlines: true,
  boot: {
    title: 'WAKE UP',
    subtitle: (v) => `${v} :: SIGNAL ACQUIRED`,
    lines: [
      'tracing carrier signal ................. locked',
      'decoding the rain ...................... 0x7F3A',
      'masking presence from the watchers ..... done',
      'opening a line out ..................... open',
      'down the rabbit hole ................... ready'
    ],
    hint: 'PRESS ANY KEY TO JACK IN'
  },
  clock: (now) => {
    const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    return {
      label: 'SYSTEM CYCLE',
      value: '0x' + secs.toString(16).toUpperCase().padStart(5, '0'),
      sub: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    }
  },
  copy: {
    brand: 'SIGNAL//RAIN',
    vessel: (n) => `NODE ${n.toUpperCase()}`,
    uplinks: (n) => plural(n, 'SIGNAL'),
    shipNameLabel: 'Node name',
    allChannels: 'All Signals',
    compose: 'INJECT',
    searchPlaceholder: 'grep the stream…',
    searchLabel: 'TRACE',
    readerLabel: 'SIGNAL',
    idleTitle: 'NO SIGNAL DECODED',
    emptyFolder: 'THE STREAM IS EMPTY',
    noResults: 'NO TRACE FOUND',
    signalLost: 'CARRIER LOST',
    loadMore: 'RECOVER OLDER SIGNALS',
    scanning: 'TRACING',
    decrypting: 'DECODING',
    composeTitle: { new: 'NEW SIGNAL', reply: 'RESPOND', replyAll: 'BROADCAST REPLY', forward: 'RELAY' },
    send: 'INJECT',
    sending: 'UPLOADING…',
    sendHint: 'CTRL+ENTER TO INJECT',
    linkAccount: 'Tap a new line',
    linkDown: 'CARRIER LOST',
    welcome: 'WAKE UP',
    configureKicker: 'LINE TAP',
    addTitle: 'Tap a new line',
    simulation: 'Training program',
    channelLabel: 'Line name',
    channelColour: 'Signal colour',
    handshakeOk: 'Carrier locked on both lines. IMAP and SMTP are open.',
    settingsKicker: 'THE OPERATOR',
    settingsTitle: 'Source Settings',
    viewscreen: 'The rain',
    comms: 'Signals',
    linkedChannels: 'Tapped lines',
    warpLabel: 'Bend the code',
    warpButton: 'BEND',
    kicker: { info: 'SIGNAL', success: 'ACCEPTED', error: 'GLITCH', incoming: 'ANOMALY' },
    toast: {
      sent: 'Signal injected',
      sendFailed: 'Injection rejected',
      archived: 'Cached',
      trashed: 'Derezzed',
      spam: 'Quarantined as malware',
      incoming: 'Anomaly detected',
      incomingMany: (n) => `${n} anomalies detected`,
      linked: 'Line tapped',
      unlinked: 'Line severed',
      partialFail: 'Some lines went dark',
      openFail: 'Signal corrupted',
      commandFail: 'Command rejected',
      noRecipient: 'No endpoint',
      noRecipientBody: 'Specify at least one recipient',
      saved: 'Payload extracted',
      saveFail: 'Extraction failed'
    }
  }
}
