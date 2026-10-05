import { type Universe, plural } from './types'

// ------------------------------------------------------------------ Retro Desktop (mid-90s PC)

export const retro: Universe = {
  id: 'retro',
  group: 'Digital',
  light: true,
  name: 'Retro Desktop',
  tagline: 'Grey beveled windows, pixel fonts, beeping PC speaker and a screensaver. It is 1995.',
  accountColors: ['#000080', '#008080', '#800000', '#008000', '#800080', '#808000', '#0000ff', '#ff0000'],
  presets: [
    { id: 'classic', name: 'Classic', primary: '#000080', secondary: '#1084d0', alert: '#c00000' },
    { id: 'teal-desk', name: 'Teal', primary: '#008080', secondary: '#20b2aa', alert: '#c00000' },
    { id: 'storm', name: 'Storm', primary: '#4a5c7a', secondary: '#8aa0c0', alert: '#c00000' },
    { id: 'plum', name: 'Plum', primary: '#5a2a6a', secondary: '#9a5aaa', alert: '#c00000' },
    { id: 'brick', name: 'Brick', primary: '#802000', secondary: '#c05030', alert: '#000080' }
  ],
  fonts: [
    { id: 'pixelify', name: 'Pixel' },
    { id: 'silkscreen', name: 'Bitmap' },
    { id: 'mono', name: 'DOS' }
  ],
  defaultFont: 'pixelify',
  bodyFont: "Tahoma, Verdana, 'Segoe UI', sans-serif",
  backgrounds: [
    { id: 'bounce', name: 'Bouncing lines' },
    { id: 'pipes', name: 'Pipes' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'bounce',
  scanlines: false,
  boot: {
    title: 'MailStation 95',
    subtitle: (v) => `Starting up on ${v}…`,
    lines: [
      'HIMEM is testing extended memory... done.',
      'Loading TCP/IP stack ............ OK',
      'Detecting 28.8k modem ........... COM2',
      'Mounting C:\\MAIL ................ OK',
      'Starting MailStation 95 ......... Please wait'
    ],
    hint: 'Press any key to continue . . .'
  },
  clock: (now) => ({
    label: 'System clock',
    value: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    sub: now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })
  }),
  copy: {
    brand: 'MailStation 95',
    vessel: (n) => `\\\\${n.toUpperCase()}`,
    uplinks: (n) => plural(n, 'connection'),
    shipNameLabel: 'Computer name',
    allChannels: 'All Mail',
    compose: 'New Message',
    searchPlaceholder: 'Find messages…',
    searchLabel: 'Find',
    readerLabel: 'Message',
    idleTitle: 'Select a message to read',
    emptyFolder: 'There are no items to show in this view.',
    noResults: 'Search complete. 0 items found.',
    signalLost: 'Unable to connect to server',
    loadMore: 'Download older messages',
    scanning: 'Please wait',
    decrypting: 'Opening',
    composeTitle: { new: 'New Message', reply: 'Re:', replyAll: 'Reply All', forward: 'Fw:' },
    send: 'Send',
    sending: 'Sending…',
    sendHint: 'Ctrl+Enter to send',
    linkAccount: 'Add account…',
    linkDown: 'Server not responding',
    welcome: 'Welcome to MailStation 95',
    configureKicker: 'Account Wizard',
    addTitle: 'Add New Account',
    simulation: 'Sample mailbox',
    channelLabel: 'Account name',
    channelColour: 'Color',
    handshakeOk: 'Test completed successfully. Incoming (IMAP) and outgoing (SMTP) servers responded.',
    settingsKicker: 'Control Panel',
    settingsTitle: 'Display Properties',
    viewscreen: 'Screen Saver',
    comms: 'Mail',
    linkedChannels: 'Accounts',
    warpLabel: 'Preview screen saver',
    warpButton: 'Preview',
    kicker: { info: 'Information', success: 'Done', error: 'Error', incoming: 'New Mail' },
    toast: {
      sent: 'Message sent',
      sendFailed: 'Message could not be sent',
      archived: 'Moved to Archive',
      trashed: 'Moved to Recycle Bin',
      spam: 'Moved to Junk',
      incoming: 'You have new mail',
      incomingMany: (n) => `You have ${n} new messages`,
      linked: 'Account added',
      unlinked: 'Account removed',
      partialFail: 'Some servers did not respond',
      openFail: 'This message could not be displayed',
      commandFail: 'The operation could not be completed',
      noRecipient: 'No recipients',
      noRecipientBody: 'There must be at least one name in the To box.',
      saved: 'File saved',
      saveFail: 'Cannot save file'
    }
  }
}
