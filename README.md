# StarMail

A local, starship-themed desktop email client for multiple accounts (Gmail, Outlook, Proton, any IMAP server). Mail stays between your machine and your provider. There is no StarMail server.

## Run

```powershell
npm install
npm run dev      # hot-reloading dev mode
npm run build    # production build into out/
npm start        # run the production build
npm run dist     # Windows installer into release/
```


On first launch, pick **Simulation** to explore the UI with a demo mailbox.

## Linking accounts

| Provider | Method | What you need |
|---|---|---|
| **Gmail** | App password *(easiest)* | 2-Step Verification on, then create a code at myaccount.google.com/apppasswords |
| **Gmail** | OAuth | Google Cloud Console → Credentials → *Desktop app* OAuth client (ID + secret). Add yourself as a test user. |
| **Outlook / Hotmail / M365** | OAuth *(required: Microsoft has turned off password sign-in for IMAP)* | Azure Portal → App registrations → personal + work accounts → platform *Mobile and desktop* with redirect `http://localhost` → enable *Allow public client flows* → copy the client ID |
| **Proton Mail** | Proton Mail Bridge | Install and run Bridge, then copy its IMAP/SMTP username and password (defaults: 127.0.0.1:1143 / 1025, STARTTLS) |
| **Other** | IMAP + SMTP | Host, port and password (often an app password) |

Secrets (passwords and refresh tokens) are encrypted with Windows DPAPI via Electron `safeStorage` and stored in `%APPDATA%\starmail\accounts.json`. If OS encryption is unavailable, StarMail refuses to store credentials at all. Unlinking a Google account also revokes its tokens with Google; Microsoft has no revocation endpoint, so those tokens are deleted locally and expire on their own.

## Universes

Pick one at the top of Settings (`Ctrl+,`). Each is a complete theme: wording, typefaces, animated background, panel shapes, sound effects, boot sequence and clock.

| Universe | Feel | Background | Sounds | Clock |
|---|---|---|---|---|
| **Space** | | | | |
| Starship | Neon command bridge | Starfield, warp tunnel, nebula, synthwave grid | Synth bleeps | Stardate |
| Frontier | Space western: riveted amber metal, bilingual signage | Dusty planet horizon, open-space drift | Plucked guitar, engine burn | Ship day + local time |
| **Fantasy** | | | | |
| Elven Realm | Twilight forest kingdom: gold filigree, serif type | Forest with rising light and falling leaves, starlit sky | Bells and harp | Moons of the year |
| Shadow Realm | Iron fortress: jagged plates, firelight | Volcanic forge with embers, ashfall with lightning | War drums and horns | Hours of shadow |
| High Seas | Pirate ship: wood, rope and brass | Moonlit sea with a ship, old sea chart with a route to the X | Ship's bell, cannon, waves | Ship's watches and bells |
| **Digital** | | | | |
| Digital Rain | Black glass, falling green code | Code rain, glitching cascade | Digital chirps | Hex system cycle |
| Zero Day | Green-screen terminal on a CRT | Scrolling console feed, packet network trace | Keyboard clicks, dial-up modem on send | Unix epoch |
| Neon City | Chrome and neon tubes | Rainy skyline with flying cars, glitch grid | Synth zaps, bass drop | Net time |
| Retro Desktop | Grey beveled windows, 1995 *(light theme)* | Bouncing lines, 3D pipes screensavers | PC-speaker beeps | Taskbar clock |
| **Atmosphere** | | | | |
| Steampunk Telegraph | Brass frames and bolts | Meshing gears with steam and a pneumatic tube, airships in amber clouds | Morse code, pneumatic whoosh | Chronometer + boiler pressure |
| Noir | Case files in black and white, film grain | Rain on the office window, light through venetian blinds | Typewriter, telephone ring | Day, hour and mood |
| Zen Garden | Paper and ink, no glow *(light theme)* | Koi pond, raked sand with petals | Wood block, wind chimes, singing bowl | Season + moon phase |
| Eldritch | Wrong-shaped panels that occasionally twitch | Tentacles in fog with a waking eye, a spiralling void of eyes | Heartbeats, dissonant drones | Countdown until it wakes |

Switching universe resets the colour scheme, typeface and background to that universe's defaults and remaps account colours to its palette. Your sound, privacy and mail settings are kept.

Each universe is spread over four places: `src/renderer/src/universes/<id>.ts` (wording, palettes, fonts, clock, boot), `src/renderer/src/scenes/` (animated background), a sound palette in `src/renderer/src/fx.ts`, and a styling block in `src/renderer/src/universes*.css`. Adding a new one means touching each of those.

## Customization (Settings / `Ctrl+,`)

- **Color schemes:** 5–7 presets per universe, or custom primary, secondary and alert colors
- **Viewscreen:** starfield, warp tunnel, nebula drift, synthwave grid, or off. Star density and speed are adjustable.
- **Interface:** glow intensity, typeface, list density, CRT scanlines, boot sequence, ship name
- **Animations:** full, subtle or off. Sound effects are synthesized live (no audio files) with a volume control.
- **Per-account:** label and color for each linked account
- **Privacy:** remote images are blocked by default. Optional dark-adapt for light HTML emails.

## Keyboard

`J`/`K` navigate · `C` compose · `R`/`A`/`F` reply / all / forward · `E` archive · `Del` delete · `S` priority · `U` unread · `/` search · `Ctrl+Enter` send · `Esc` close

## Layout

```
src/main/       Electron main process: IMAP (imapflow), SMTP (nodemailer), OAuth PKCE, encrypted store, demo mailbox
src/preload/    contextBridge API exposed as window.api
src/shared/     types shared across processes
src/renderer/   React UI (zustand store, framer-motion, canvas starfield, WebAudio fx)
```

HTML email renders in a sandboxed iframe with no scripts and a strict CSP. Links open in your default browser.
