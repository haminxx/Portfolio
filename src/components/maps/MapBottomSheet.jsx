import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { Search } from 'lucide-react'

function useSnapHeights() {
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 640))

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return useMemo(() => {
    const peek = 96
    const half = Math.round(vh * 0.48)
    const full = Math.max(peek + 120, vh - 72)
    return { peek, half, full }
  }, [vh])
}

export default function MapBottomSheet({
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching = false,
}) {
  const { peek, half, full } = useSnapHeights()
  const heights = useMemo(() => [peek, half, full], [peek, half, full])
  const [snapIndex, setSnapIndex] = useState(1)
  const heightMv = useMotionValue(heights[1])
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startY: 0,
    startH: 0,
    lastY: 0,
    lastT: 0,
    vy: 0,
  })

  useEffect(() => {
    const target = heights[snapIndex]
    animate(heightMv, target, { type: 'spring', damping: 34, stiffness: 420, mass: 0.85 })
  }, [snapIndex, heights, heightMv])

  const snapToNearest = useCallback(
    (current, velocityY) => {
      const bias = velocityY * 0.2
      const projected = current + bias
      let best = 0
      let bestDist = Infinity
      heights.forEach((h, i) => {
        const d = Math.abs(projected - h)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      setSnapIndex(best)
    },
    [heights],
  )

  const onGrabDown = (e) => {
    if (e.button !== 0) return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const now = performance.now()
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startH: heightMv.get(),
      lastY: e.clientY,
      lastT: now,
      vy: 0,
    }
  }

  const onGrabMove = (e) => {
    const d = dragRef.current
    if (!d.active) return
    const now = performance.now()
    const dt = Math.max(1, now - d.lastT)
    d.vy = (e.clientY - d.lastY) / dt * 1000
    d.lastY = e.clientY
    d.lastT = now
    const dy = e.clientY - d.startY
    let next = d.startH - dy
    if (next > full) next = full + Math.min(48, (next - full) * 0.18)
    else if (next < peek) next = peek - Math.min(48, (peek - next) * 0.18)
    else next = Math.max(peek, Math.min(full, next))
    heightMv.set(next)
  }

  const onGrabUp = (e) => {
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.pointerId) return
    d.active = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const h = heightMv.get()
    if (h > full) heightMv.set(full)
    if (h < peek) heightMv.set(peek)
    snapToNearest(Math.max(peek, Math.min(full, h)), d.vy)
  }

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[8] flex justify-center">
      <motion.div
        className="pointer-events-auto flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/20 bg-white/80 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-neutral-700/50 dark:bg-black/80"
        style={{ height: heightMv, maxHeight: '100vh' }}
      >
        <div
          className="flex flex-col items-center pt-2 pb-1 touch-none"
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabUp}
          onPointerCancel={onGrabUp}
          role="presentation"
        >
          <div className="h-1 w-10 cursor-grab rounded-full bg-neutral-400/80 active:cursor-grabbing dark:bg-neutral-500" aria-hidden />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-white/60 px-3 py-2 backdrop-blur-sm dark:border-neutral-600/50 dark:bg-neutral-900/40">
            <Search size={18} className="shrink-0 text-neutral-500" strokeWidth={1.75} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
              placeholder="Search maps"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100"
            />
            <button
              type="button"
              onClick={() => onSearch?.()}
              disabled={isSearching || !searchQuery?.trim()}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              {isSearching ? '…' : 'Go'}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 font-sans text-neutral-800 dark:text-neutral-200">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
            Places
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            Drag the grabber to resize: peek, half, or full. The map stays usable outside this panel.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
