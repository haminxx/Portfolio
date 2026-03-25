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
      return { baseIconSize: 64, maxScale: 1.6, effectWidth: 240 }
    }

    const smallerDimension = Math.min(window.innerWidth, window.innerHeight)

    if (smallerDimension < 480) {
      return {
        baseIconSize: Math.max(40, smallerDimension * 0.08),
        maxScale: 1.4,
        effectWidth: smallerDimension * 0.4,
      }
    }
    if (smallerDimension < 768) {
      return {
        baseIconSize: Math.max(48, smallerDimension * 0.07),
        maxScale: 1.5,
        effectWidth: smallerDimension * 0.35,
      }
    }
    if (smallerDimension < 1024) {
      return {
        baseIconSize: Math.max(56, smallerDimension * 0.06),
        maxScale: 1.6,
        effectWidth: smallerDimension * 0.3,
      }
    }
    return {
      baseIconSize: Math.max(64, Math.min(80, smallerDimension * 0.05)),
      maxScale: 1.8,
      effectWidth: 300,
    }
  }, [])

  const [config, setConfig] = useState(getResponsiveConfig)
  const { baseIconSize, maxScale, effectWidth } = config
  const minScale = 1.0
  const baseSpacing = Math.max(4, baseIconSize * 0.08)

  useEffect(() => {
    const handleResize = () => setConfig(getResponsiveConfig())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getResponsiveConfig])

  const activeMouseX = pauseMagnification ? null : mouseX

  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null) {
        return apps.map(() => minScale)
      }

      return apps.map((_, index) => {
        const normalIconCenter =
          index * (baseIconSize + baseSpacing) + baseIconSize / 2
        const minX = mousePosition - effectWidth / 2
        const maxX = mousePosition + effectWidth / 2

        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return minScale
        }

        const theta =
          ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI)
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2

        return minScale + scaleFactor * (maxScale - minScale)
      })
    },
    [apps, baseIconSize, baseSpacing, effectWidth, maxScale, minScale],
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
    const lerpFactor = activeMouseX !== null ? 0.2 : 0.12

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
      className={`backdrop-blur-md ${className}`}
      style={{
        width: `${contentWidth + padding * 2}px`,
        background: 'rgba(45, 45, 45, 0.75)',
        borderRadius: `${Math.max(12, baseIconSize * 0.4)}px`,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: `
          0 ${Math.max(4, baseIconSize * 0.1)}px ${Math.max(16, baseIconSize * 0.4)}px rgba(0, 0, 0, 0.4),
          0 ${Math.max(2, baseIconSize * 0.05)}px ${Math.max(8, baseIconSize * 0.2)}px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
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
              className="absolute flex cursor-grab flex-col items-center justify-end active:cursor-grabbing"
              data-dock-app-id={app.id}
              title={app.name}
              role="presentation"
              onPointerDown={(e) => {
                onIconPointerDown?.(e, app.id, index)
              }}
              onPointerMove={(e) => onIconPointerMove?.(e)}
              onPointerUp={(e) => onIconPointerUp?.(e, app.id, index)}
              onPointerCancel={(e) => onIconPointerUp?.(e, app.id, index)}
              onClick={() => handleAppClick(app.id, index)}
              style={{
                left: `${position - scaledSize / 2 + shift}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10),
                opacity: isDraggingTile ? 0.42 : 1,
                transition: isDraggingTile
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
                  filter: `drop-shadow(0 ${
                    scale > 1.2
                      ? Math.max(2, baseIconSize * 0.05)
                      : Math.max(1, baseIconSize * 0.03)
                  }px ${
                    scale > 1.2
                      ? Math.max(4, baseIconSize * 0.1)
                      : Math.max(2, baseIconSize * 0.06)
                  }px rgba(0,0,0,${0.2 + (scale - 1) * 0.15}))`,
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
