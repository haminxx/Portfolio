import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useMemo,
} from 'react'
import type React from 'react'

export interface DockApp {
  id: string
  name: string
  icon: string
  imgClassName?: string
}

export interface MacOSDockProps {
  apps: DockApp[]
  onAppClick: (appId: string) => void
  openApps?: string[]
  className?: string
  /** Extra horizontal offset per icon (e.g. insert-preview shim) */
  shiftPxByIndex?: number[]
  /** While reordering, dim this app tile */
  draggingId?: string | null
  /** Freeze magnification (e.g. during pointer reorder) */
  pauseMagnification?: boolean
  /** Set true on pointerup after a drag reorder to swallow the following click */
  suppressClickRef?: React.MutableRefObject<boolean>
  onIconPointerDown?: (
    e: React.PointerEvent,
    appId: string,
    index: number,
  ) => void
  onIconPointerMove?: (e: React.PointerEvent) => void
  onIconPointerUp?: (
    e: React.PointerEvent,
    appId: string,
    index: number,
  ) => void
}

const MacOSDock = forwardRef<HTMLDivElement, MacOSDockProps>(function MacOSDock(
  {
    apps,
    onAppClick,
    openApps = [],
    className = '',
    shiftPxByIndex,
    draggingId,
    pauseMagnification = false,
    suppressClickRef,
    onIconPointerDown,
    onIconPointerMove,
    onIconPointerUp,
  },
  forwardedRef,
) {
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [currentScales, setCurrentScales] = useState<number[]>(() =>
    apps.map(() => 1),
  )
  const [currentPositions, setCurrentPositions] = useState<number[]>([])
  const dockRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastMouseMoveTime = useRef<number>(0)

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      dockRef.current = el
      if (typeof forwardedRef === 'function') {
        forwardedRef(el)
      } else if (forwardedRef) {
        ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current =
          el
      }
    },
    [forwardedRef],
  )

  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: 64, maxScale: 1.48, effectWidth: 200 }
    }

    const smallerDimension = Math.min(window.innerWidth, window.innerHeight)

    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(40, smallerDimension * 0.08),
        maxScale: 1.34,
        effectWidth: smallerDimension * 0.32,
      }
    }
    if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(48, smallerDimension * 0.07),
        maxScale: 1.4,
        effectWidth: smallerDimension * 0.28,
      }
    }
    if (smallerDimension < 1024) {
      return {
        baseIconSize: Math.max(56, smallerDimension * 0.06),
        maxScale: 1.44,
        effectWidth: smallerDimension * 0.24,
      }
    }
    return {
      baseIconSize: Math.max(64, Math.min(80, smallerDimension * 0.05)),
      maxScale: 1.5,
      effectWidth: 220,
    }
  }, [])

  const [config, setConfig] = useState(getResponsiveConfig)
  const { baseIconSize, maxScale } = config
  const minScale = 1.0
  const baseSpacing = Math.max(4, baseIconSize * 0.08)

  useEffect(() => {
    const handleResize = () => setConfig(getResponsiveConfig())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveConfig])

  const activeMouseX = pauseMagnification ? null : mouseX

  /** Gaussian bump from mouse → one dominant “hovered” icon; neighbors stay smaller. */
  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) {
        return apps.map(() => minScale)
      }

      const sigma = baseIconSize * 0.42

      return apps.map((_, index) => {
        const slotCenter =
          index * (baseIconSize + baseSpacing) + baseIconSize / 2
        const d = mousePosition - slotCenter
        const g = Math.exp(-(d * d) / (2 * sigma * sigma))
        return minScale + g * (maxScale - minScale)
      })
    },
    [apps, baseIconSize, baseSpacing, maxScale, minScale],
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

  useEffect(() => {
    const initialScales = apps.map(() => minScale)
    const initialPositions = calculatePositions(initialScales)
    setCurrentScales(initialScales)
    setCurrentPositions(initialPositions)
  }, [apps, calculatePositions, minScale, config])

  useEffect(() => {
    setCurrentScales((prev) => {
      if (prev.length === apps.length) return prev
      return apps.map(() => minScale)
    })
  }, [apps, minScale])

  const animateToTarget = useCallback(() => {
    const targetScales = calculateTargetMagnification(activeMouseX ?? null)
    const targetPositions = calculatePositions(targetScales)
    const lerpFactor = activeMouseX !== null ? 0.22 : 0.12

    setCurrentScales((prevScales) => {
      if (prevScales.length !== targetScales.length) return targetScales
      return prevScales.map((currentScale, index) => {
        const diff = targetScales[index] - currentScale
        return currentScale + diff * lerpFactor
      })
    })

    setCurrentPositions((prevPositions) => {
      if (prevPositions.length !== targetPositions.length) return targetPositions
      return prevPositions.map((currentPos, index) => {
        const diff = targetPositions[index] - currentPos
        return currentPos + diff * lerpFactor
      })
    })

    animationFrameRef.current = requestAnimationFrame(animateToTarget)
  }, [activeMouseX, calculateTargetMagnification, calculatePositions])

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animateToTarget])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (pauseMagnification) return
      const now = performance.now()

      if (now - lastMouseMoveTime.current < 16) {
        return
      }

      lastMouseMoveTime.current = now

      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect()
        const padding = Math.max(8, baseIconSize * 0.12)
        setMouseX(e.clientX - rect.left - padding)
      }
    },
    [baseIconSize, pauseMagnification],
  )

  const handleMouseLeave = useCallback(() => {
    setMouseX(null)
  }, [])

  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-8, -baseIconSize * 0.15)
    element.style.transition = 'transform 0.2s ease-out'
    element.style.transform = `translateY(${bounceHeight}px)`

    setTimeout(() => {
      element.style.transform = 'translateY(0px)'
    }, 200)
  }

  const handleAppClick = (appId: string, index: number) => {
    if (suppressClickRef?.current) {
      suppressClickRef.current = false
      return
    }
    const el = iconRefs.current[index]
    if (el) {
      type GsapWindow = Window & { gsap?: { to: (...args: unknown[]) => void } }
      const w = window as GsapWindow
      if (w.gsap) {
        const bounceHeight =
          currentScales[index] > 1.3
            ? -baseIconSize * 0.2
            : -baseIconSize * 0.15

        w.gsap.to(el, {
          y: bounceHeight,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          transformOrigin: 'bottom center',
        })
      } else {
        createBounceAnimation(el)
      }
    }

    onAppClick(appId)
  }

  const contentWidth = useMemo(() => {
    if (currentPositions.length === 0) {
      return apps.length * (baseIconSize + baseSpacing) - baseSpacing
    }
    return Math.max(
      ...currentPositions.map(
        (pos, index) => pos + (baseIconSize * currentScales[index]) / 2,
      ),
    )
  }, [
    apps.length,
    baseIconSize,
    baseSpacing,
    currentPositions,
    currentScales,
  ])

  const padding = Math.max(8, baseIconSize * 0.12)

  return (
    <div
      ref={setRefs}
      className={className}
      style={{
        width: `${contentWidth + padding * 2}px`,
        background: 'var(--liquid-glass-fill, rgba(255, 255, 255, 0.12))',
        backdropFilter: 'var(--liquid-glass-blur, saturate(200%) blur(22px))',
        WebkitBackdropFilter: 'var(--liquid-glass-blur, saturate(200%) blur(22px))',
        borderRadius: `${Math.max(12, baseIconSize * 0.4)}px`,
        border: '1px solid var(--liquid-glass-border, rgba(255, 255, 255, 0.28))',
        boxShadow: `
          0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(20, baseIconSize * 0.45)}px rgba(0, 0, 0, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.35),
          inset 0 -1px 0 rgba(0, 0, 0, 0.08)
        `,
        padding: `${padding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{
          height: `${baseIconSize}px`,
          width: '100%',
        }}
      >
        {apps.map((app, index) => {
          const scale = currentScales[index] ?? 1
          const position = currentPositions[index] || 0
          const scaledSize = baseIconSize * scale
          const shift = shiftPxByIndex?.[index] ?? 0
          const isDraggingTile = draggingId === app.id

          return (
            <div
              key={app.id}
              ref={(el) => {
                iconRefs.current[index] = el
              }}
              className="absolute flex cursor-grab flex-col items-center justify-center active:cursor-grabbing"
              data-dock-app-id={app.id}
              aria-label={app.name}
              onPointerDown={(e) => {
                onIconPointerDown?.(e, app.id, index)
              }}
              onPointerMove={(e) => onIconPointerMove?.(e)}
              onPointerUp={(e) => onIconPointerUp?.(e, app.id, index)}
              onPointerCancel={(e) => onIconPointerUp?.(e, app.id, index)}
              onClick={() => handleAppClick(app.id, index)}
              style={{
                left: `${position - scaledSize / 2 + shift}px`,
                bottom: `${(baseIconSize * (scale - 1)) / 2}px`,
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'center center',
                zIndex: Math.round(scale * 10),
                opacity: isDraggingTile ? 0.42 : 1,
                transition:
                  draggingId && !isDraggingTile
                    ? 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease'
                    : isDraggingTile
                      ? 'opacity 0.15s ease'
                      : 'opacity 0.2s ease',
              }}
            >
              <img
                src={app.icon}
                alt=""
                width={scaledSize}
                height={scaledSize}
                className={`object-contain ${app.imgClassName ?? ''}`}
                draggable={false}
                style={{
                  borderRadius: 12,
                  display: 'block',
                  filter: `drop-shadow(0 ${
                    scale > 1.12
                      ? Math.max(2, baseIconSize * 0.04)
                      : Math.max(1, baseIconSize * 0.03)
                  }px ${
                    scale > 1.12
                      ? Math.max(3, baseIconSize * 0.08)
                      : Math.max(2, baseIconSize * 0.06)
                  }px rgba(0,0,0,${0.2 + (scale - 1) * 0.14}))`,
                }}
              />

              {openApps.includes(app.id) && (
                <div
                  className="absolute"
                  style={{
                    bottom: `${Math.max(-2, -baseIconSize * 0.05)}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `${Math.max(3, baseIconSize * 0.06)}px`,
                    height: `${Math.max(3, baseIconSize * 0.06)}px`,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
})

export default MacOSDock
