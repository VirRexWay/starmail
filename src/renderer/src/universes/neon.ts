import { type Universe, dayOfYear, pad, plural } from './types'

// ------------------------------------------------------------------ Neon City (cyberpunk)

export const neon: Universe = {
  id: 'neon',
  group: 'Digital',
  name: 'Neon City',
  tagline: 'Rain on chrome, a skyline of neon signs and flying cars. High tech, low life.',
  accountColors: ['#ff2a6d', '#05d9e8', '#f9f002', '#b967ff', '#01ffc3', '#ff7b00', '#ff71ce', '#7cff4f'],
  presets: [
    { id: 'night-market', name: 'Night Market', primary: '#ff2a6d', secondary: '#05d9e8', alert: '#f9f002' },
    { id: 'chrome-cyan', name: 'Chrome Cyan', primary: '#05d9e8', secondary: '#b967ff', alert: '#ff2a6d' },
    { id: 'toxic', name: 'Toxic', primary: '#c6ff00', secondary: '#ff00a0', alert: '#ff5500' },
    { id: 'sunset-strip', name: 'Sunset Strip', primary: '#ff7b00', secondary: '#ff2a6d', alert: '#05d9e8' },
    { id: 'ultraviolet', name: 'Ultraviolet', primary: '#b967ff', secondary: '#01ffc3', alert: '#ff2a6d' }
  ],
  fonts: [
    { id: 'audiowide', name: 'Chrome' },
    { id: 'monoton', name: 'Neon Sign' },
    { id: 'rajdhani', name: 'Street' },
    { id: 'mono', name: 'Terminal' }
  ],
  defaultFont: 'audiowide',
  bodyFont: "'Rajdhani', 'Exo 2', sans-serif",
  backgrounds: [
    { id: 'neoncity', name: 'Skyline' },
    { id: 'glitchgrid', name: 'Glitch grid' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'neoncity',
  scanlines: true,
  boot: {
    title: 'NEONET',
    subtitle: (v) => `${v} — JACKED IN`,
    lines: [
      'NEURAL LINK HANDSHAKE ............. STABLE',
      'ICE COUNTERMEASURES ............... EVADED',
      'CORPO TRACKERS .................... SPOOFED',
      'CREDCHIP BALANCE .................. NEGATIVE',
      'THE CITY NEVER SLEEPS ............. NEITHER DO YOU'
    ],
    hint: 'PRESS ANY KEY // 押して'
  },
  clock: (now) => ({
    label: 'NET TIME',
    value: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    sub: `SECTOR ${pad(dayOfYear(now) % 99)} · ACID RAIN 87%`
  }),
  copy: {
    brand: 'NEONET',
    vessel: (n) => `${n.toUpperCase()} // SECTOR 7`,
    uplinks: (n) => plural(n, 'FEED'),
    shipNameLabel: 'Handle',
    allChannels: 'All Feeds',
    compose: 'PING',
    searchPlaceholder: 'Scrub the feeds…',
    searchLabel: 'SCRUB',
    readerLabel: 'MESSAGE',
    idleTitle: 'NO FEED SELECTED',
    emptyFolder: 'DEAD AIR',
    noResults: 'NOTHING ON THE NET',
    signalLost: 'FLATLINED',
    loadMore: 'PULL OLDER FEEDS',
    scanning: 'SCRUBBING',
    decrypting: 'CRACKING',
    composeTitle: { new: 'NEW PING', reply: 'PING BACK', replyAll: 'PING THE CREW', forward: 'BOUNCE' },
    send: 'SEND',
    sending: 'UPLOADING…',
    sendHint: 'CTRL+ENTER TO SEND',
    linkAccount: 'Jack in a new feed',
    linkDown: 'FLATLINED',
    welcome: 'WELCOME TO THE CITY',
    configureKicker: 'NEURAL LINK',
    addTitle: 'Jack in a new feed',
    simulation: 'Sim run',
    channelLabel: 'Feed name',
    channelColour: 'Neon colour',
    handshakeOk: 'Link is clean. IMAP and SMTP are jacked in.',
    settingsKicker: 'CHROME SHOP',
    settingsTitle: 'Augments',
    viewscreen: 'The city',
    comms: 'Netlink',
    linkedChannels: 'Live feeds',
    warpLabel: 'Overclock',
    warpButton: 'BOOST',
    kicker: { info: 'NET', success: 'CLEAN', error: 'GLITCH', incoming: 'PING' },
    toast: {
      sent: 'Ping sent',
      sendFailed: 'Ping bounced',
      archived: 'Stashed',
      trashed: 'Deleted from the net',
      spam: 'Flagged as corpo spam',
      incoming: 'Incoming ping',
      incomingMany: (n) => `${n} pings incoming`,
      linked: 'Feed jacked in',
      unlinked: 'Feed unplugged',
      partialFail: 'Some feeds flatlined',
      openFail: 'Data shard corrupted',
      commandFail: 'ICE blocked that',
      noRecipient: 'No target',
      noRecipientBody: 'Who are you pinging, friend?',
      saved: 'Shard saved',
      saveFail: 'Shard fried'
    }
  }
}
