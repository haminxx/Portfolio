'use client'

import { useState, useRef, useCallback, useEffect, type PointerEvent, type ReactNode } from 'react'

export interface MacOSDockApp {
  id: string
  name: string
  icon?: string
  renderIcon?: (pixelSize: number) => ReactNode
}

export interface MacOSDockProps {
  apps: MacOSDockApp[]
  onAppClick: (id: string) => void
  openAppIds?: string[]
  shiftXByIndex?: (index: number) => number
  onAppPointerDown?: (e: PointerEvent<HTMLDivElement>, id: string, index: number) => void
  /** Register each icon root element for hit-testing (e.g. dock reorder). */
  onIconElementRef?: (id: string, element: HTMLDivElement | null) => void
  className?: string
}

const MIN_SCALE = 1

export default function MacOSDock({
  apps,
  onAppClick,
  openAppIds = [],
  shiftXByIndex,
  onAppPointerDown,
  onIconElementRef,
  className = '',
}: MacOSDockProps) {
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [renderScales, setRenderScales] = useState<number[]>(() => apps.map(() => MIN_SCALE))
  const [renderPositions, setRenderPositions] = useState<number[]>([])

  const dockRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number>(0)
  const appsRef = useRef(apps)
  appsRef.current = apps

  const scalesRef = useRef<number[]>(apps.map(() => MIN_SCALE))
  const positionsRef = useRef<number[]>([])
  const mouseXRef = useRef<number | null>(null)

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 56, maxScale: 1.65, effectWidth: 260 }
    }
    const smallerDimension = Math.min(window.innerWidth, window.innerHeight)
    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(36, smallerDimension * 0.075),
        maxScale: 1.35,
        effectWidth: smallerDimension * 0.38,
      }
    }
    if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(44, smallerDimension * 0.065),
        maxScale: 1.45,
        effectWidth: smallerDimension * 0.32,
      }
    }
    if (smallerDimension < 1024) {
      return {
        baseIconSize: Math.max(50, smallerDimension * 0.055),
        maxScale: 1.55,
        effectWidth: 240,
      }
    }
    return {
      baseIconSize: Math.max(52, Math.min(64, smallerDimension * 0.048)),
      maxScale: 1.7,
      effectWidth: 280,
    }
  }, [])

  const [config, setConfig] = useState(getResponsiveConfig)
  const { baseIconSize, maxScale, effectWidth } = config
  const baseSpacing = Math.max(3, baseIconSize * 0.07)

  useEffect(() => {
    const onResize = () => setConfig(getResponsiveConfig())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [getResponsiveConfig])

  useEffect(() => {
    mouseXRef.current = mouseX
  }, [mouseX])

  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      const list = appsRef.current
      if (mousePosition === null || list.length === 0) {
        return list.map(() => MIN_SCALE)
      }
      return list.map((_, index) => {
        const normalIconCenter = index * (baseIconSize + baseSpacing) + baseIconSize / 2
        const minX = mousePosition - effectWidth / 2
        const maxX = mousePosition + effectWidth / 2
        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return MIN_SCALE
        }
        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI)
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2
        return MIN_SCALE + scaleFactor * (maxScale - MIN_SCALE)
      })
    },
    [baseIconSize, baseSpacing, effectWidth, maxScale],
  )

  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0
      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale
        const centerX = currentX + scaledWidth / 2
        currentX += scaledWidth + baseSpacing
        return centerX
      })
    },
    [baseIconSize, baseSpacing],
  )

  const appIdsKey = apps.map((a) => a.id).join('|')
  useEffect(() => {
    const list = appsRef.current
    scalesRef.current = list.map(() => MIN_SCALE)
    positionsRef.current = calculatePositions(scalesRef.current)
    setRenderScales([...scalesRef.current])
    setRenderPositions([...positionsRef.current])
  }, [appIdsKey, calculatePositions])

  useEffect(() => {
    const tick = () => {
      const listLen = appsRef.current.length
      if (scalesRef.current.length !== listLen) {
        scalesRef.current = Array.from({ length: listLen }, () => MIN_SCALE)
        positionsRef.current = calculatePositions(scalesRef.current)
      }
      const mx = mouseXRef.current
      const targetScales = calculateTargetMagnification(mx)
      const targetPositions = calculatePositions(targetScales)
      const lerpFactor = mx !== null ? 0.22 : 0.14

      let changed = false
      const nextScales = scalesRef.current.map((s, i) => {
        const t = targetScales[i] ?? MIN_SCALE
        const n = s + (t - s) * lerpFactor
        if (Math.abs(n - s) > 0.0005) changed = true
        return n
      })
      const nextPos = positionsRef.current.map((p, i) => {
        const t = targetPositions[i] ?? 0
        const n = p + (t - p) * lerpFactor
        if (Math.abs(n - p) > 0.05) changed = true
        return n
      })

      scalesRef.current = nextScales
      positionsRef.current = nextPos

      if (changed || mx !== null) {
        setRenderScales([...nextScales])
        setRenderPositions([...nextPos])
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [calculateTargetMagnification, calculatePositions])

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!dockRef.current) return
      const rect = dockRef.current.getBoundingClientRect()
      const padding = Math.max(8, baseIconSize * 0.12)
      setMouseX(e.clientX - rect.left - padding)
    },
    [baseIconSize],
  )

  const handleMouseLeave = useCallback(() => {
    setMouseX(null)
  }, [])

  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-8, -baseIconSize * 0.14)
    element.style.transition = 'transform 0.2s ease-out'
    element.style.transform = `translateY(${bounceHeight}px)`
    window.setTimeout(() => {
      element.style.transform = 'translateY(0px)'
    }, 200)
  }

  const handleAppClick = (appId: string, index: number) => {
    const el = iconRefs.current[index]
    if (el) {
      createBounceAnimation(el)
    }
    onAppClick(appId)
  }

  const padding = Math.max(8, baseIconSize * 0.12)
  const contentWidth =
    renderPositions.length > 0
      ? Math.max(
          ...renderPositions.map((pos, index) => {
            const scale = renderScales[index] ?? MIN_SCALE
            return pos + (baseIconSize * scale) / 2
          }),
        )
      : Math.max(0, apps.length * (baseIconSize + baseSpacing) - baseSpacing)

  return (
    <div
      ref={dockRef}
      className={`backdrop-blur-md ${className}`}
      style={{
        width: `${contentWidth + padding * 2}px`,
        maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(45, 45, 45, 0.72)',
        borderRadius: `${Math.max(12, baseIconSize * 0.38)}px`,
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: `
          0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(16, baseIconSize * 0.38)}px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.12)
        `,
        padding: `${padding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{
          height: `${baseIconSize * maxScale * 1.05}px`,
          width: '100%',
        }}
      >
        {apps.map((app, index) => {
          const scale = renderScales[index] ?? MIN_SCALE
          const position = renderPositions[index] ?? 0
          const scaledSize = baseIconSize * scale
          const shift = shiftXByIndex?.(index) ?? 0

          return (
            <div
              key={app.id}
              role="button"
              tabIndex={0}
              className="absolute flex cursor-pointer flex-col items-center justify-end outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title={app.name}
              onClick={() => handleAppClick(app.id, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleAppClick(app.id, index)
                }
              }}
              onPointerDown={(e) => onAppPointerDown?.(e, app.id, index)}
              ref={(el) => {
                iconRefs.current[index] = el
                onIconElementRef?.(app.id, el)
              }}
              style={{
                left: `${position - scaledSize / 2 + shift}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10),
              }}
            >
              {app.icon ? (
                <img
                  src={app.icon}
                  alt=""
                  width={scaledSize}
                  height={scaledSize}
                  className="pointer-events-none object-contain"
                  draggable={false}
                  style={{
                    filter: `drop-shadow(0 ${scale > 1.15 ? Math.max(2, baseIconSize * 0.05) : Math.max(1, baseIconSize * 0.03)}px ${scale > 1.15 ? Math.max(4, baseIconSize * 0.1) : Math.max(2, baseIconSize * 0.06)}px rgba(0,0,0,${0.2 + (scale - 1) * 0.12}))`,
                  }}
                />
              ) : (
                <span className="pointer-events-none flex h-full w-full items-center justify-center text-white">
                  {app.renderIcon?.(scaledSize * 0.55)}
                </span>
              )}

              {openAppIds.includes(app.id) && (
                <div
                  className="absolute"
                  style={{
                    bottom: `${Math.max(-2, -baseIconSize * 0.05)}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${Math.max(3, baseIconSize * 0.06)}px`,
                    height: `${Math.max(3, baseIconSize * 0.06)}px`,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
