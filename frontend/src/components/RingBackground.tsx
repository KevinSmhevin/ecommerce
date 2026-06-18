import type { CSSProperties } from 'react'

interface RingBurst {
  top: string
  left: string
  size: number
  durationSeconds: number
  delaySeconds: number
}

// Scattered emitters of concentric red rings that fade in and out. `top`/`left`
// mark each burst's center (the inline transform recenters it).
const RING_BURSTS: RingBurst[] = [
  { top: '14%', left: '16%', size: 420, durationSeconds: 8.0,  delaySeconds: 0 },
  { top: '24%', left: '82%', size: 520, durationSeconds: 10.0, delaySeconds: -3 },
  { top: '58%', left: '40%', size: 360, durationSeconds: 9.0,  delaySeconds: -6 },
  { top: '78%', left: '78%', size: 480, durationSeconds: 8.5,  delaySeconds: -2 },
  { top: '70%', left: '10%', size: 400, durationSeconds: 11.0, delaySeconds: -7 },
  { top: '40%', left: '60%', size: 300, durationSeconds: 7.5,  delaySeconds: -4.5 },
]

const burstStyle = ({ top, left, size, durationSeconds, delaySeconds }: RingBurst): CSSProperties => ({
  top,
  left,
  width: size,
  height: size,
  transform: 'translate(-50%, -50%)',
  animationDuration: `${durationSeconds}s`,
  animationDelay: `${delaySeconds}s`,
})

const RingBackground = () => (
  <div className="ring-field" aria-hidden="true">
    {RING_BURSTS.map((burst, i) => (
      <span key={i} className="ring-burst" style={burstStyle(burst)} />
    ))}
  </div>
)

export default RingBackground
