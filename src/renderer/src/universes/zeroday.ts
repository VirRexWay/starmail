import { type Universe, hhmm, plural } from './types'

// ------------------------------------------------------------------ Zero Day (hacker terminal)

export const zeroday: Universe = {
  id: 'zeroday',
  group: 'Digital',
  name: 'Zero Day',
  tagline: 'A green-screen terminal at 3 a.m. Scrolling exploits, packet traces and a dial-up modem.',
  accountColors: ['#33ff33', '#ffb000', '#00ccff', '#ff5555', '#e0e0e0', '#cc66ff', '#66ffcc', '#ffff55'],
  presets: [
    { id: 'green-screen', name: 'Green Screen', primary: '#33ff33', secondary: '#1fa31f', alert: '#ff5555' },
    { id: 'amber-crt', name: 'Amber CRT', primary: '#ffb000', secondary: '#cc7a00', alert: '#ff5555' },
    { id: 'blue-team', name: 'Blue Team', primary: '#4dc3ff', secondary: '#2a7fff', alert: '#ff5c5c' },
    { id: 'red-team', name: 'Red Team', primary: '#ff4040', secondary: '#ff9a3c', alert: '#ffee55' },
    { id: 'paper-white', name: 'Paper White', primary: '#e8e8e8', secondary: '#9a9a9a', alert: '#ff5555' }
  ],
  fonts: [
    { id: 'vt323', name: 'CRT' },
    { id: 'plex', name: 'Console' },
    { id: 'mono', name: 'Terminal' }
  ],
  defaultFont: 'vt323',
  bodyFont: "'IBM Plex Mono', 'Share Tech Mono', monospace",
  backgrounds: [
    { id: 'terminal', name: 'Terminal feed' },
    { id: 'nettrace', name: 'Net trace' },
    { id: 'none', name: 'Off' }
  ],
  defaultBackground: 'terminal',
  scanlines: true,
  boot: {
    title: 'ACCESS GRANTED',
    subtitle: (v) => `logged in as ${v}`,
    lines: [
      '> warming up the CRT .............. OK',
      '> decrypting mail vault ........... OK',
      '> syncing message queue ........... OK',
      '> brewing coffee .................. OK',
      '> session ready. welcome back.'
    ],
    hint: 'press any key_'
  },
  clock: (now) => ({
    label: 'EPOCH',
    value: String(Math.floor(now.getTime() / 1000)),
    sub: `${hhmm(now)} local`
  }),
  copy: {
    brand: 'root@mail:~$',
    vessel: (n) => `${n.toLowerCase().replace(/\s+/g, '-')}@localhost`,
    uplinks: (n) => plural(n, 'shell'),
    shipNameLabel: 'Hostname',
    allChannels: 'all_inboxes',
    compose: './compose',
    searchPlaceholder: 'grep -ri "…"',
    searchLabel: 'grep',
    readerLabel: 'packet',
    idleTitle: 'no packet selected',
    emptyFolder: '0 packets captured',
    noResults: 'grep: no matches',
    signalLost: 'connection reset by peer',
    loadMore: 'tail -n +older',
    scanning: 'sniffing',
    decrypting: 'decrypting',
    composeTitle: { new: 'vim new_message', reply: 're: >', replyAll: 're: >> all', forward: 'fwd | pipe' },
    send: './transmit',
    sending: 'dialing…',
    sendHint: 'ctrl+enter to execute',
    linkAccount: 'ssh new-account',
    linkDown: 'host unreachable',
    welcome: 'ACCESS GRANTED',
    configureKicker: 'ssh config',
    addTitle: 'Open a new shell',
    simulation: 'Honeypot',
    channelLabel: 'Alias',
    channelColour: 'Prompt colour',
    handshakeOk: 'handshake OK. IMAP and SMTP sockets open.',
    settingsKicker: '~/.config',
    settingsTitle: 'dotfiles',
    viewscreen: 'Display',
    comms: 'Network',
    linkedChannels: 'Open shells',
    warpLabel: 'Overclock the CPU',
    warpButton: 'turbo',
    kicker: { info: 'INFO', success: '[+] OK', error: '[!] ERR', incoming: '[>] RX' },
    toast: {
      sent: 'Message delivered',
      sendFailed: 'Transmission refused',
      archived: 'tar -czf archive/',
      trashed: 'rm -rf done',
      spam: 'Moved to /dev/null',
      incoming: 'Incoming packet',
      incomingMany: (n) => `${n} packets received`,
      linked: 'Shell established',
      unlinked: 'Connection closed',
      partialFail: 'Some hosts timed out',
      openFail: 'Checksum mismatch',
      commandFail: 'Permission denied',
      noRecipient: 'Missing argument',
      noRecipientBody: 'usage: transmit <to> [...]',
      saved: 'Downloaded',
      saveFail: 'Write failed'
    }
  }
}
