export interface SceneOpts {
  density: number
  speed: number
  primary: string
  secondary: string
  alert: string
}

/**
 * A full-window animated background. The host (components/Backdrop.tsx) owns the
 * canvas, device-pixel-ratio, animation loop and the "warp" surge; a scene only draws.
 */
export interface Scene {
  resize(w: number, h: number): void
  /**
   * @param dt     time step in 60fps frames (0 when frozen)
   * @param boost  surge strength, 0 at rest, ~30 at full warp
   * @param t      timestamp in ms
   */
  draw(g: CanvasRenderingContext2D, dt: number, boost: number, t: number): void
}

export const rand = (a: number, b: number): number => a + Math.random() * (b - a)

/** Soft round glow sprite, pre-rendered once so drawing hundreds per frame stays cheap. */
export function glowSprite(rgb: string, size = 64): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${rgb}, 1)`)
  grad.addColorStop(0.25, `rgba(${rgb}, 0.55)`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}

export function offscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return [c, c.getContext('2d')!]
}
