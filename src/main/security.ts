import type { ServerConfig } from '@shared/types'

/**
 * Transport-security rules shared by every IMAP/SMTP connection.
 *
 * - Credentials are never sent over an unencrypted socket: non-TLS ports must
 *   upgrade with STARTTLS or the connection is refused (prevents a network
 *   attacker from stripping STARTTLS and reading the password).
 * - Certificate checks may only be relaxed for a server on this machine
 *   (Proton Mail Bridge uses a self-signed cert on 127.0.0.1).
 */

export function isLoopback(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, '')
  return h === 'localhost' || h === '::1' || /^127(\.\d{1,3}){3}$/.test(h)
}

export function assertServerSafe(server: ServerConfig, label: 'IMAP' | 'SMTP'): void {
  if (server.allowSelfSigned && !isLoopback(server.host)) {
    throw new Error(
      `${label}: certificate checks can only be relaxed for a server on this computer (e.g. Proton Mail Bridge on 127.0.0.1), not ${server.host}`
    )
  }
}

/** TLS options: verification stays on unless the server is local and flagged self-signed. */
export function tlsOptions(server: ServerConfig): { rejectUnauthorized: false } | undefined {
  return server.allowSelfSigned && isLoopback(server.host) ? { rejectUnauthorized: false } : undefined
}

// ---------------------------------------------------------------- IPC input validation
// The renderer is treated as untrusted: every value crossing IPC is checked here.

export function str(v: unknown, name: string, max = 10_000): string {
  if (typeof v !== 'string' || v.length > max) throw new Error(`Invalid ${name}`)
  return v
}

/** A string that ends up in a mail header: no CR/LF, so it cannot inject extra headers. */
export function headerStr(v: unknown, name: string, max = 10_000): string {
  return str(v, name, max).replace(/[\r\n]+/g, ' ')
}

export function posInt(v: unknown, name: string): number {
  if (!Number.isSafeInteger(v) || (v as number) < 1) throw new Error(`Invalid ${name}`)
  return v as number
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], name: string): T {
  if (!allowed.includes(v as T)) throw new Error(`Invalid ${name}`)
  return v as T
}

// ---------------------------------------------------------------- attachments

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i

/** Reduce an attacker-supplied attachment name to a plain file name (no directories, no reserved names). */
export function safeFilename(name: string | undefined): string {
  let base = (name ?? '').split(/[\\/]/).pop() ?? ''
  base = base.replace(/[<>:"|?*\u0000-\u001f‮]/g, '_').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 180)
  if (WINDOWS_RESERVED.test(base)) base = '_' + base
  return base || 'attachment'
}

/** File types that run code when double-clicked on Windows. */
export const EXECUTABLE_EXT = /\.(exe|com|scr|pif|bat|cmd|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|msi|msp|hta|cpl|lnk|reg|jar|iso|img|vhd|vhdx|appx|msix|application|chm)$/i
