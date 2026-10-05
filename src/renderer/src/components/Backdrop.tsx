import { useEffect, useRef } from 'react'
import type { BackgroundId } from '@shared/types'
import { onWarp } from '../fx'
import { createScene } from '../scenes'

interface Props {
  mode: BackgroundId
  density: number
  speed: number
  primary: string
  secondary: string
  alert: string
  animated: boolean
}

/** Full-window canvas that hosts the current universe's background scene. */
export function Backdrop({ mode, density, speed, primary, secondary, alert, animated }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (mode === 'none') return
    const canvas = ref.current!
    const g = canvas.getContext('2d')!
    const scene = createScene(mode, { density, speed, primary, secondary, alert })
    let raf = 0
    let boost = 0
    let boostTarget = 0
    let boostUntil = 0

    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      scene.resize(canvas.clientWidth, canvas.clientHeight)
      if (!animated) scene.draw(g, 0, 0, performance.now())
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const frame = (now: number): void => {
      const dt = Math.min(50, now - last) / 16.67
      last = now
      if (now > boostUntil) boostTarget = 0
      boost += (boostTarget - boost) * (boostTarget > boost ? 0.06 : 0.03) * dt
      // With animations off the scene stays frozen, but a surge still plays out
      scene.draw(g, animated || boost > 0.05 ? dt : 0, boost, now)
      if (animated || boost > 0.05 || boostTarget > 0) raf = requestAnimationFrame(frame)
    }

    const offWarp = onWarp((strength, ms) => {
      boostTarget = 30 * strength
      boostUntil = performance.now() + ms
      if (!animated) {
        cancelAnimationFrame(raf)
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      offWarp()
    }
  }, [mode, density, speed, primary, secondary, alert, animated])

  if (mode === 'none') return <div className="starfield starfield--none" />
  return <canvas ref={ref} className="starfield" />
}
