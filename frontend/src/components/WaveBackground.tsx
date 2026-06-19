import { Fragment } from 'react'

// Lava/magma background: thin, uneven curvy "cracks" (mix of smooth curves and
// sharp angular peaks, with short and very tall lumps) drawn in a 1200x1200
// viewBox. The whole field is rotated 45deg by CSS so the lines run top-left →
// bottom-right. Each crack carries a glowing magma pulse — a gradient band that
// travels along the line to the far end and flows back, with a bright head and
// a fading tail.

const VIEW = 1200
const COMET_LENGTH = 280

interface Wave {
  d: string
  durationSeconds: number
  beginSeconds: number
}

const WAVES: Wave[] = [
  {
    d: 'M 0 180 C 120 120, 180 90, 260 160 L 320 60 L 360 220 C 440 320, 520 300, 600 190 ' +
       'L 660 210 C 760 230, 740 80, 860 110 L 920 250 C 1020 360, 1100 300, 1200 200',
    durationSeconds: 11, beginSeconds: 0,
  },
  {
    d: 'M 0 420 C 100 380, 160 520, 260 500 L 300 360 C 360 260, 460 300, 520 430 ' +
       'L 580 470 C 680 520, 700 360, 820 380 L 900 300 C 1000 360, 1080 480, 1200 440',
    durationSeconds: 14, beginSeconds: -3,
  },
  {
    d: 'M 0 640 L 80 560 C 180 600, 220 760, 320 740 C 420 720, 380 540, 500 560 ' +
       'L 560 700 C 660 800, 740 620, 860 650 L 940 780 C 1040 740, 1120 600, 1200 660',
    durationSeconds: 17, beginSeconds: -7,
  },
  {
    d: 'M 0 860 C 120 820, 160 960, 280 940 L 340 800 C 440 760, 520 900, 600 880 ' +
       'L 680 980 C 780 1000, 760 820, 900 840 L 980 960 C 1080 1000, 1140 860, 1200 900',
    durationSeconds: 13, beginSeconds: -10,
  },
  {
    d: 'M 0 1060 C 140 1020, 200 1140, 320 1120 L 380 1000 C 480 980, 540 1100, 660 1080 ' +
       'L 740 1160 C 840 1160, 860 1020, 980 1040 L 1060 1140 C 1140 1120, 1180 1040, 1200 1080',
    durationSeconds: 19, beginSeconds: -5,
  },
]

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const LavaGradient = ({ index, wave }: { index: number; wave: Wave }) => (
  <linearGradient id={`lava-${index}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={COMET_LENGTH} y2="0">
    <stop offset="0%"   stopColor="#ff5a00" stopOpacity="0" />
    <stop offset="50%"  stopColor="#ff3000" stopOpacity="0.55" />
    <stop offset="82%"  stopColor="#ff9a20" stopOpacity="0.95" />
    <stop offset="96%"  stopColor="#ffe6a0" stopOpacity="1" />
    <stop offset="100%" stopColor="#ffe6a0" stopOpacity="0" />
    {!prefersReducedMotion() && (
      <animateTransform
        attributeName="gradientTransform"
        type="translate"
        values={`${-COMET_LENGTH} 0; ${VIEW} 0; ${-COMET_LENGTH} 0`}
        keyTimes="0;0.5;1"
        calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
        dur={`${wave.durationSeconds}s`}
        begin={`${wave.beginSeconds}s`}
        repeatCount="indefinite"
      />
    )}
  </linearGradient>
)

const WaveBackground = () => (
  <div className="wave-field" aria-hidden="true">
    <div className="wave-rotor">
      <svg className="wave-svg" viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none">
        <defs>
          {WAVES.map((wave, i) => (
            <LavaGradient key={i} index={i} wave={wave} />
          ))}
        </defs>

        {/* Dark rock cracks */}
        {WAVES.map((wave, i) => (
          <path
            key={`rock-${i}`}
            d={wave.d}
            fill="none"
            stroke="rgba(0, 0, 0, 0.30)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="miter"
            strokeMiterlimit={6}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Magma: faint channel + traveling glowing pulse */}
        <g className="wave-lava">
          {WAVES.map((wave, i) => (
            <Fragment key={`lava-${i}`}>
              <path
                d={wave.d}
                fill="none"
                stroke="rgba(220, 38, 38, 0.14)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="miter"
                strokeMiterlimit={6}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={wave.d}
                fill="none"
                stroke={`url(#lava-${i})`}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="miter"
                strokeMiterlimit={6}
                vectorEffect="non-scaling-stroke"
              />
            </Fragment>
          ))}
        </g>
      </svg>
    </div>
  </div>
)

export default WaveBackground
