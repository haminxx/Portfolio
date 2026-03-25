import { MeshGradient, DotOrbit } from '@paper-design/shaders-react'

const SPEED = 0.55

export default function DesktopShaderBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#0a0a0b',
      }}
    >
      <MeshGradient
        className="absolute inset-0 h-full w-full"
        colors={['#0a0a0b', '#1a1a1e', '#2a2a32', '#c8ccd8']}
        speed={SPEED * 0.5}
        distortion={0.78}
        swirl={0.12}
        grainMixer={0.04}
        grainOverlay={0.02}
      />
      <div className="absolute inset-0 opacity-[0.5]">
        <DotOrbit
          className="h-full w-full"
          colorBack="#000000"
          colors={['#333333', '#4a4e58', '#6b7280']}
          speed={SPEED * 1.2}
          size={0.35}
          sizeRange={0.15}
          spreading={0.85}
        />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/4 left-1/3 h-32 w-32 rounded-full blur-3xl animate-pulse bg-neutral-500/10"
          style={{ animationDuration: `${2.8 / SPEED}s` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 h-24 w-24 rounded-full blur-2xl animate-pulse bg-white/5"
          style={{ animationDuration: `${2 / SPEED}s`, animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 right-1/3 h-20 w-20 rounded-full blur-xl animate-pulse bg-neutral-900/10"
          style={{ animationDuration: `${3.5 / SPEED}s`, animationDelay: '0.5s' }}
        />
      </div>
    </div>
  )
}
