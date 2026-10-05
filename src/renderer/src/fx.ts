import type { UniverseId } from '@shared/types'
import { rand } from './scenes/types'

/**
 * Effects bus: synthesized sound effects (no audio files) with one sound
 * palette per universe, plus the "warp" signal the background scenes react to.
 */

let ctx: AudioContext | null = null
let reverb: ConvolverNode | null = null
let enabled = true
let volume = 0.4
let profile: UniverseId = 'starship'

export function configureSound(on: boolean, vol: number, universe: UniverseId): void {
  enabled = on
  volume = vol
  profile = universe
}

function audio(): AudioContext | null {
  if (!enabled) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Generated hall reverb (decaying noise impulse) used for bells and harps. */
function reverbSend(a: AudioContext): AudioNode {
  if (!reverb) {
    const len = a.sampleRate * 2.2
    const impulse = a.createBuffer(2, len, a.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    }
    reverb = a.createConvolver()
    reverb.buffer = impulse
    const wet = a.createGain()
    wet.gain.value = 0.35
    reverb.connect(wet).connect(a.destination)
  }
  return reverb
}

interface ToneOpts {
  type?: OscillatorType
  to?: number
  delay?: number
  gain?: number
  attack?: number
  wet?: boolean
}

function tone(freq: number, dur: number, opts: ToneOpts = {}): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + (opts.delay ?? 0)
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  const peak = volume * (opts.gain ?? 0.15)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + (opts.attack ?? 0.01))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  if (opts.wet) g.connect(reverbSend(a))
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(dur: number, from: number, to: number, gain = 0.12, opts: { delay?: number; type?: BiquadFilterType; q?: number } = {}): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + (opts.delay ?? 0)
  const buf = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const filter = a.createBiquadFilter()
  filter.type = opts.type ?? 'bandpass'
  filter.Q.value = opts.q ?? 2
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(volume * gain, t + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(a.destination)
  src.start(t)
}

/** Plucked string (Karplus-Strong): guitar for Frontier, harp for the Elven Realm. */
function pluck(freq: number, dur: number, gain = 0.12, opts: { delay?: number; decay?: number; wet?: boolean } = {}): void {
  const a = audio()
  if (!a) return
  const sr = a.sampleRate
  const len = Math.floor(sr * dur)
  const period = Math.max(2, Math.round(sr / freq))
  const buf = a.createBuffer(1, len, sr)
  const y = buf.getChannelData(0)
  const decay = opts.decay ?? 0.996
  for (let i = 0; i < len; i++) {
    if (i < period) {
      y[i] = Math.random() * 2 - 1 // the "pluck": a burst of noise one period long
    } else {
      const j = i - period
      y[i] = decay * 0.5 * (y[j] + y[Math.max(0, j - 1)]) // averaging filter = string damping
    }
  }
  const src = a.createBufferSource()
  src.buffer = buf
  const g = a.createGain()
  g.gain.value = volume * gain
  src.connect(g).connect(a.destination)
  if (opts.wet) g.connect(reverbSend(a))
  src.start(a.currentTime + (opts.delay ?? 0))
}

/** Bell: fundamental plus inharmonic partials that die away faster. */
function bell(freq: number, dur: number, gain = 0.06, delay = 0): void {
  ;[
    [1, 1],
    [2.0, 0.5],
    [2.76, 0.35],
    [5.4, 0.15]
  ].forEach(([ratio, amp], i) => tone(freq * ratio, dur / (1 + i * 0.6), { gain: gain * amp, delay, attack: 0.004, wet: true }))
}

/** Low drum: pitch-dropping sine plus a thump of noise. */
function drum(gain = 0.25, delay = 0, pitch = 110): void {
  tone(pitch, 0.45, { to: 40, gain, delay, attack: 0.003 })
  noise(0.12, 900, 120, gain * 0.5, { delay, type: 'lowpass', q: 0.7 })
}

/** Horn: two detuned saws through a swelling low-pass filter. */
function horn(freq: number, dur: number, gain = 0.08, delay = 0): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const filter = a.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 4
  filter.frequency.setValueAtTime(180, t)
  filter.frequency.exponentialRampToValueAtTime(1300, t + dur * 0.4)
  filter.frequency.exponentialRampToValueAtTime(300, t + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(volume * gain, t + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  filter.connect(g).connect(a.destination)
  for (const detune of [-8, 8]) {
    const osc = a.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = detune
    osc.connect(filter)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }
}

/** Mechanical click: keyboard keys, typewriter strikes, clock ticks. */
function click(gain = 0.12, delay = 0, bright = 3000): void {
  noise(0.03, bright, bright * 0.6, gain, { delay, type: 'highpass', q: 0.7 })
  tone(150, 0.04, { gain: gain * 0.4, delay, attack: 0.002 })
}

/** Morse code on a telegraph sounder: '.' dit, '-' dah, ' ' gap. */
function morse(pattern: string, freq = 700, unit = 0.07): void {
  let t = 0
  for (const ch of pattern) {
    if (ch === ' ') {
      t += unit * 2
      continue
    }
    const len = ch === '-' ? unit * 3 : unit
    tone(freq, len, { type: 'square', gain: 0.04, delay: t, attack: 0.003 })
    t += len + unit
  }
}

/** A short, recognisable dial-up modem handshake. */
function modem(): void {
  ;[[697, 1209], [770, 1336], [852, 1477], [941, 1336]].forEach(([a, b], i) => {
    tone(a, 0.09, { gain: 0.05, delay: i * 0.11 })
    tone(b, 0.09, { gain: 0.05, delay: i * 0.11 })
  })
  tone(2100, 0.45, { gain: 0.05, delay: 0.5 })
  tone(1650, 0.18, { type: 'square', gain: 0.025, delay: 1.0 })
  tone(1850, 0.18, { type: 'square', gain: 0.025, delay: 1.18 })
  noise(0.7, 900, 2600, 0.12, { delay: 1.35, q: 1 })
  tone(980, 0.3, { type: 'sawtooth', to: 1180, gain: 0.03, delay: 1.4 })
}

/** Old telephone bell: two-tone ring bursts. */
function ring(times = 2): void {
  for (let r = 0; r < times; r++) {
    for (let k = 0; k < 8; k++) {
      tone(440, 0.04, { gain: 0.05, delay: r * 0.6 + k * 0.05 })
      tone(480, 0.04, { gain: 0.05, delay: r * 0.6 + k * 0.05 })
    }
  }
}

/** Singing bowl: two slightly detuned partials beating slowly. */
function bowl(freq: number, dur = 3, gain = 0.05, delay = 0): void {
  tone(freq, dur, { gain, attack: 0.02, delay, wet: true })
  tone(freq * 1.006, dur, { gain: gain * 0.8, attack: 0.02, delay, wet: true })
  tone(freq * 2.71, dur * 0.5, { gain: gain * 0.25, attack: 0.02, delay, wet: true })
}

type SfxName = 'hover' | 'select' | 'open' | 'close' | 'confirm' | 'error' | 'incoming' | 'send' | 'trash' | 'boot'
type Palette = Record<SfxName, () => void>

const HARP = [523, 587, 659, 784, 880, 1046, 1175]

const PALETTES: Record<UniverseId, Palette> = {
  starship: {
    hover: () => tone(1800, 0.04, { gain: 0.04 }),
    select: () => tone(880, 0.07, { type: 'triangle', to: 1320, gain: 0.1 }),
    open: () => {
      tone(520, 0.09, { type: 'triangle', gain: 0.1 })
      tone(780, 0.12, { type: 'triangle', delay: 0.06, gain: 0.1 })
    },
    close: () => tone(700, 0.1, { type: 'triangle', to: 350, gain: 0.08 }),
    confirm: () => {
      tone(660, 0.08, { type: 'square', gain: 0.05 })
      tone(990, 0.14, { type: 'square', delay: 0.08, gain: 0.05 })
    },
    error: () => {
      tone(220, 0.18, { type: 'sawtooth', gain: 0.08 })
      tone(180, 0.25, { type: 'sawtooth', delay: 0.15, gain: 0.08 })
    },
    incoming: () => [0, 0.12, 0.24].forEach((d, i) => tone(880 + i * 220, 0.1, { delay: d, gain: 0.12 })),
    send: () => {
      noise(1.1, 300, 4000, 0.18)
      tone(120, 1.0, { type: 'sawtooth', to: 1200, gain: 0.06 })
    },
    trash: () => noise(0.35, 3000, 200, 0.14),
    boot: () => {
      tone(60, 1.6, { type: 'sawtooth', to: 240, gain: 0.07 })
      ;[0.5, 0.7, 0.9, 1.3].forEach((d, i) => tone([440, 660, 880, 1320][i], 0.12, { delay: d, gain: 0.07 }))
    }
  },

  frontier: {
    hover: () => pluck(1760, 0.12, 0.03, { decay: 0.98 }),
    select: () => pluck(440, 0.5, 0.12),
    open: () => {
      pluck(330, 0.6, 0.1)
      pluck(494, 0.6, 0.1, { delay: 0.07 })
    },
    close: () => {
      pluck(494, 0.4, 0.08)
      pluck(330, 0.5, 0.08, { delay: 0.06 })
    },
    confirm: () => [196, 247, 294, 392].forEach((f, i) => pluck(f, 1.0, 0.09, { delay: i * 0.03 })),
    error: () => {
      pluck(110, 0.8, 0.14, { decay: 0.99 })
      pluck(116.5, 0.8, 0.12, { delay: 0.02, decay: 0.99 })
    },
    incoming: () => {
      pluck(659, 0.7, 0.12)
      pluck(880, 0.9, 0.12, { delay: 0.18 })
    },
    send: () => {
      noise(1.6, 80, 900, 0.22, { type: 'lowpass', q: 1 })
      tone(55, 1.4, { type: 'sawtooth', to: 140, gain: 0.07, attack: 0.3 })
    },
    trash: () => {
      tone(180, 0.12, { type: 'square', gain: 0.06 })
      tone(523, 0.5, { gain: 0.05, delay: 0.01 })
      tone(841, 0.4, { gain: 0.04, delay: 0.01 })
      noise(0.15, 4000, 1500, 0.1, { q: 3 })
    },
    boot: () => {
      ;[0, 0.28, 0.5].forEach((d) => noise(0.18, 200, 90, 0.2, { delay: d, type: 'lowpass', q: 1 }))
      noise(1.0, 90, 400, 0.18, { delay: 0.7, type: 'lowpass', q: 1 })
      ;[196, 247, 294, 392].forEach((f, i) => pluck(f, 1.4, 0.09, { delay: 1.3 + i * 0.04 }))
    }
  },

  elven: {
    hover: () => bell(2637, 0.5, 0.012),
    select: () => bell(1318, 1.2, 0.05),
    open: () => HARP.slice(0, 5).forEach((f, i) => pluck(f, 0.9, 0.06, { delay: i * 0.045, decay: 0.998, wet: true })),
    close: () => HARP.slice(0, 5).reverse().forEach((f, i) => pluck(f, 0.8, 0.05, { delay: i * 0.04, decay: 0.998, wet: true })),
    confirm: () => {
      bell(784, 1.6, 0.05)
      bell(1175, 1.8, 0.04, 0.12)
    },
    error: () => {
      bell(330, 1.6, 0.06)
      bell(392, 1.6, 0.05, 0.18)
    },
    incoming: () => [1046, 1318, 1568].forEach((f, i) => bell(f, 1.6, 0.05, i * 0.22)),
    send: () => {
      noise(1.6, 400, 5000, 0.08, { q: 0.8 })
      HARP.concat(HARP.map((f) => f * 2)).forEach((f, i) => pluck(f, 1.0, 0.045, { delay: i * 0.05, decay: 0.998, wet: true }))
    },
    trash: () => [880, 659, 523].forEach((f, i) => bell(f, 1.0, 0.035, i * 0.12)),
    boot: () => {
      ;[261.6, 329.6, 392].forEach((f) => tone(f, 2.6, { gain: 0.05, attack: 1.2, wet: true }))
      ;[1046, 1568, 2093].forEach((f, i) => bell(f, 2, 0.035, 1.0 + i * 0.25))
    }
  },

  shadow: {
    hover: () => tone(90, 0.06, { gain: 0.05 }),
    select: () => drum(0.18, 0, 120),
    open: () => {
      noise(0.45, 700, 180, 0.14, { q: 6 })
      tone(70, 0.4, { gain: 0.08 })
    },
    close: () => drum(0.16, 0, 90),
    confirm: () => {
      drum(0.2)
      drum(0.24, 0.18)
    },
    error: () => {
      tone(110, 0.5, { type: 'sawtooth', gain: 0.07 })
      tone(155.6, 0.5, { type: 'sawtooth', gain: 0.06 })
    },
    incoming: () => {
      drum(0.2, 0)
      drum(0.2, 0.3)
      drum(0.3, 0.6, 90)
    },
    send: () => {
      horn(73.4, 1.7, 0.1)
      drum(0.25, 0.05, 80)
    },
    trash: () => noise(0.7, 300, 3200, 0.2, { type: 'lowpass', q: 1.5 }),
    boot: () => {
      drum(0.3, 0, 80)
      drum(0.3, 0.55, 80)
      horn(55, 2.2, 0.1, 0.9)
    }
  },

  seas: {
    hover: () => pluck(180, 0.15, 0.04, { decay: 0.9 }),
    select: () => pluck(220, 0.4, 0.1, { decay: 0.97 }),
    open: () => tone(110, 0.5, { type: 'sawtooth', to: 140, gain: 0.03, attack: 0.1 }),
    close: () => drum(0.1, 0, 140),
    confirm: () => {
      bell(880, 1.2, 0.05)
      bell(880, 1.2, 0.05, 0.35)
    },
    error: () => horn(65, 1.2, 0.08),
    incoming: () => [0, 0.35, 0.9, 1.25].forEach((d) => bell(880, 1.1, 0.045, d)),
    send: () => {
      drum(0.35, 0, 55)
      noise(0.6, 2000, 200, 0.25, { type: 'lowpass', q: 0.8 })
      noise(1.2, 300, 1200, 0.1, { delay: 0.5, type: 'lowpass', q: 0.6 })
    },
    trash: () => noise(0.8, 1800, 150, 0.18, { type: 'lowpass', q: 1 }),
    boot: () => {
      noise(2.2, 200, 800, 0.12, { type: 'lowpass', q: 0.5 })
      ;[0.6, 0.95, 1.5, 1.85].forEach((d) => bell(880, 1.2, 0.04, d))
    }
  },

  rain: {
    hover: () => tone(3000, 0.02, { type: 'square', gain: 0.015 }),
    select: () => tone(1200, 0.06, { type: 'square', to: 2400, gain: 0.04 }),
    open: () => {
      tone(800, 0.04, { type: 'square', gain: 0.04 })
      tone(1600, 0.05, { type: 'square', gain: 0.04, delay: 0.05 })
    },
    close: () => tone(1600, 0.08, { type: 'square', to: 600, gain: 0.04 }),
    confirm: () => [1046, 1568, 2093].forEach((f, i) => tone(f, 0.05, { type: 'square', gain: 0.03, delay: i * 0.05 })),
    error: () => {
      tone(90, 0.3, { type: 'sawtooth', gain: 0.08 })
      noise(0.25, 3000, 600, 0.08, { q: 4 })
    },
    incoming: () => [0, 0.06, 0.12].forEach((d) => tone(2400, 0.035, { type: 'square', gain: 0.035, delay: d })),
    send: () => {
      for (let i = 0; i < 24; i++) tone(rand(600, 3200), 0.025, { type: 'square', gain: 0.02, delay: i * 0.035 })
      tone(200, 0.9, { type: 'sawtooth', to: 2000, gain: 0.03 })
    },
    trash: () => tone(1800, 0.3, { type: 'square', to: 60, gain: 0.04 }),
    boot: () => {
      tone(55, 2, { type: 'sawtooth', gain: 0.04, attack: 0.5 })
      for (let i = 0; i < 10; i++) tone(400 + i * 180, 0.04, { type: 'square', gain: 0.025, delay: 0.6 + i * 0.08 })
    }
  },

  zeroday: {
    hover: () => click(0.03, 0, 4000),
    select: () => click(0.1),
    open: () => {
      click(0.1)
      click(0.08, 0.07)
    },
    close: () => click(0.08, 0, 2200),
    confirm: () => {
      tone(880, 0.1, { gain: 0.06 })
      tone(1320, 0.18, { gain: 0.06, delay: 0.1 })
    },
    error: () => {
      tone(140, 0.15, { type: 'square', gain: 0.06 })
      tone(140, 0.15, { type: 'square', gain: 0.06, delay: 0.2 })
    },
    incoming: () => {
      tone(2100, 0.08, { gain: 0.05 })
      tone(1300, 0.12, { gain: 0.05, delay: 0.1 })
    },
    send: () => modem(),
    trash: () => {
      for (let i = 0; i < 6; i++) click(0.07, i * 0.045)
      tone(70, 0.2, { gain: 0.1, delay: 0.3 })
    },
    boot: () => {
      for (let i = 0; i < 18; i++) click(0.06, i * rand(0.04, 0.08) + i * 0.02, rand(2500, 4500))
      tone(1000, 0.15, { type: 'square', gain: 0.04, delay: 1.5 })
    }
  },

  neon: {
    hover: () => tone(2200, 0.03, { type: 'sawtooth', to: 3300, gain: 0.015 }),
    select: () => pluck(330, 0.3, 0.08, { decay: 0.985 }),
    open: () => tone(300, 0.15, { type: 'sawtooth', to: 1200, gain: 0.04 }),
    close: () => tone(1200, 0.15, { type: 'sawtooth', to: 300, gain: 0.04 }),
    confirm: () => [261.6, 329.6, 392, 523].forEach((f) => tone(f, 0.25, { type: 'sawtooth', gain: 0.025 })),
    error: () => {
      tone(80, 0.35, { type: 'square', gain: 0.07 })
      tone(84, 0.35, { type: 'square', gain: 0.07 })
    },
    incoming: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.08, { type: 'sawtooth', gain: 0.03, delay: i * 0.07 })),
    send: () => {
      tone(55, 0.8, { type: 'sine', to: 30, gain: 0.2 })
      tone(2000, 0.5, { type: 'sawtooth', to: 80, gain: 0.05 })
      noise(0.5, 4000, 400, 0.1)
    },
    trash: () => {
      for (let i = 0; i < 8; i++) tone(rand(100, 2000), 0.03, { type: 'square', gain: 0.03, delay: i * 0.03 })
    },
    boot: () => {
      tone(55, 2.2, { type: 'sawtooth', gain: 0.05, attack: 1 })
      tone(110, 2.2, { type: 'sawtooth', gain: 0.03, attack: 1 })
      ;[523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.1, { type: 'sawtooth', gain: 0.03, delay: 1.1 + i * 0.09 }))
    }
  },

  retro: {
    hover: () => undefined,
    select: () => tone(600, 0.03, { type: 'square', gain: 0.03 }),
    open: () => tone(880, 0.08, { type: 'triangle', gain: 0.06 }),
    close: () => tone(660, 0.08, { type: 'triangle', gain: 0.05 }),
    confirm: () => {
      tone(880, 0.07, { type: 'square', gain: 0.03 })
      tone(1175, 0.1, { type: 'square', gain: 0.03, delay: 0.08 })
    },
    error: () => [440, 554, 659].forEach((f) => tone(f, 0.25, { type: 'square', gain: 0.025 })),
    incoming: () => [784, 988, 1175].forEach((f, i) => tone(f, 0.09, { type: 'square', gain: 0.03, delay: i * 0.1 })),
    send: () => {
      for (let i = 0; i < 9; i++) click(0.06, i * 0.07 + (i % 3) * 0.04, 1800)
      tone(1000, 0.12, { type: 'square', gain: 0.03, delay: 0.85 })
    },
    trash: () => noise(0.25, 1500, 400, 0.12, { q: 1 }),
    boot: () => [261.6, 329.6, 392, 523, 659].forEach((f, i) => tone(f, 1.6 - i * 0.1, { gain: 0.04, attack: 0.05, delay: i * 0.12 }))
  },

  steampunk: {
    hover: () => click(0.03, 0, 5000),
    select: () => {
      click(0.08, 0, 2500)
      click(0.05, 0.04, 2000)
    },
    open: () => {
      noise(0.3, 6000, 3000, 0.07, { type: 'highpass', q: 0.5 })
      tone(320, 0.12, { type: 'square', gain: 0.03, delay: 0.2 })
    },
    close: () => tone(260, 0.15, { type: 'square', gain: 0.04 }),
    confirm: () => bell(1568, 0.8, 0.05),
    error: () => tone(70, 0.8, { type: 'sawtooth', to: 55, gain: 0.07 }),
    incoming: () => morse('.-.. . -', 700),
    send: () => {
      noise(0.5, 300, 5000, 0.18, { q: 1.2 })
      tone(90, 0.12, { gain: 0.12, delay: 0.55 })
      noise(0.08, 900, 300, 0.12, { delay: 0.55, type: 'lowpass' })
    },
    trash: () => noise(1.0, 7000, 4000, 0.1, { type: 'highpass', q: 0.5 }),
    boot: () => {
      for (let i = 0; i < 14; i++) click(0.05, 0.6 * (1 - Math.pow(0.88, i)) * 2.2, 3500)
      tone(1200, 1.0, { gain: 0.04, attack: 0.15, delay: 1.3 })
      tone(1212, 1.0, { gain: 0.03, attack: 0.15, delay: 1.3 })
    }
  },

  noir: {
    hover: () => undefined,
    select: () => click(0.1, 0, 2200),
    open: () => noise(0.18, 3000, 800, 0.06, { q: 1 }),
    close: () => click(0.08, 0, 1800),
    confirm: () => {
      click(0.1)
      click(0.1, 0.09)
    },
    error: () => [220, 261.6, 311].forEach((f, i) => tone(f, 0.9, { type: 'triangle', gain: 0.04, delay: i * 0.03 })),
    incoming: () => ring(2),
    send: () => {
      bell(2093, 0.6, 0.04)
      noise(0.35, 1500, 5000, 0.08, { delay: 0.15, q: 2 })
    },
    trash: () => {
      for (let i = 0; i < 7; i++) noise(0.06, rand(1500, 5000), rand(800, 2000), 0.07, { delay: i * rand(0.03, 0.07), q: 1 })
    },
    boot: () => {
      noise(2.5, 2500, 2000, 0.05, { type: 'highpass', q: 0.3 })
      ;[220, 261.6, 196].forEach((f, i) => horn(f, 0.7, 0.04, 0.8 + i * 0.45))
    }
  },

  zen: {
    hover: () => undefined,
    select: () => {
      tone(800, 0.12, { gain: 0.04, attack: 0.002 })
      click(0.03, 0, 1200)
    },
    open: () => bell(1760, 1.2, 0.02),
    close: () => bell(1318, 1.0, 0.02),
    confirm: () => bowl(220, 3, 0.05),
    error: () => {
      tone(180, 0.15, { gain: 0.06, attack: 0.002 })
      tone(180, 0.15, { gain: 0.06, attack: 0.002, delay: 0.2 })
    },
    incoming: () => [1568, 1760, 2093, 2349].forEach((f) => bell(f, 1.6, 0.018, rand(0, 0.4))),
    send: () => {
      tone(1200, 0.25, { to: 400, gain: 0.06, attack: 0.002 })
      bell(880, 1.6, 0.02, 0.2)
    },
    trash: () => noise(0.6, 900, 600, 0.03, { q: 0.5 }),
    boot: () => bowl(110, 4.5, 0.07)
  },

  eldritch: {
    hover: () => noise(0.12, 2200, 1800, 0.015, { q: 6 }),
    select: () => tone(55, 0.3, { gain: 0.1 }),
    open: () => [110, 116.5, 130.8].forEach((f) => tone(f, 0.6, { type: 'sawtooth', gain: 0.025, attack: 0.15 })),
    close: () => tone(220, 0.6, { to: 80, gain: 0.04 }),
    confirm: () => {
      drum(0.12, 0, 70)
      horn(49, 1.0, 0.05, 0.1)
    },
    error: () => [100, 106, 141].forEach((f) => tone(f, 0.8, { type: 'sawtooth', gain: 0.03 })),
    incoming: () => {
      drum(0.16, 0, 60)
      drum(0.12, 0.18, 55)
      drum(0.16, 0.9, 60)
      drum(0.12, 1.08, 55)
    },
    send: () => {
      ;[55, 58.3, 82.4].forEach((f) => tone(f, 1.8, { type: 'sawtooth', to: f * 2, gain: 0.03, attack: 0.6 }))
      noise(1.6, 200, 2500, 0.08, { q: 2 })
    },
    trash: () => noise(0.5, 1200, 200, 0.15, { type: 'lowpass', q: 8 }),
    boot: () => {
      tone(40, 4, { gain: 0.08, attack: 1.5 })
      tone(41.5, 4, { gain: 0.07, attack: 1.5 })
      for (let i = 0; i < 5; i++) noise(0.5, rand(1500, 3000), rand(1500, 3000), 0.02, { delay: 0.8 + i * 0.5, q: 8 })
    }
  }
}

export const sfx = Object.fromEntries(
  (Object.keys(PALETTES.starship) as SfxName[]).map((name) => [name, () => PALETTES[profile][name]()])
) as Palette

type Listener = (strength: number, ms: number) => void
const warpListeners = new Set<Listener>()

/** Briefly surge the background scene (warp jump, burn, gust of wind, flare of the forge). */
export function warp(strength = 1, ms = 1400): void {
  warpListeners.forEach((l) => l(strength, ms))
}

export function onWarp(l: Listener): () => void {
  warpListeners.add(l)
  return () => warpListeners.delete(l)
}
