import { useRef, useState, useEffect } from 'react'
import media from '../../data/netflixMedia.json'

const HOVER_DELAY_MS = 500
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

export default function NetflixMonochromeCarousel() {
  const [hoverKey, setHoverKey] = useState(null)
  const timersRef = useRef(new Map())

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [])

  const clearTimer = (key) => {
    const t = timersRef.current.get(key)
    if (t) {
      clearTimeout(t)
      timersRef.current.delete(key)
    }
  }

  const handleEnter = (key) => {
    clearTimer(key)
    const t = setTimeout(() => setHoverKey(key), HOVER_DELAY_MS)
    timersRef.current.set(key, t)
  }

  const handleLeave = (key) => {
    clearTimer(key)
    setHoverKey((h) => (h === key ? null : h))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-950 px-6 py-10 font-sans text-neutral-100">
      <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">Collection</p>
      <div
        className="flex gap-4 overflow-x-auto pb-4 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {media.map((item, index) => {
          const key = `${item.title}-${index}`
          const active = hoverKey === key
          const hasImg = typeof item.image === 'string' && item.image.trim().length > 0

          return (
            <div
              key={key}
              className="relative flex w-[min(72vw,280px)] flex-shrink-0 snap-start"
              style={{ zIndex: active ? 30 : 1 }}
              onMouseEnter={() => handleEnter(key)}
              onMouseLeave={() => handleLeave(key)}
            >
              <div
                className="flex w-full origin-center flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-lg transition-[transform,box-shadow] duration-300"
                style={{
                  transform: active ? 'scale(1.15)' : 'scale(1)',
                  transitionTimingFunction: EASE,
                  boxShadow: active ? '0 24px 48px rgba(0,0,0,0.55)' : undefined,
                }}
              >
                <div className="aspect-video w-full overflow-hidden bg-neutral-800">
                  {hasImg ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
                  )}
                </div>
                <div
                  className="overflow-hidden bg-black text-white transition-[max-height,opacity] duration-300"
                  style={{
                    maxHeight: active ? 120 : 0,
                    opacity: active ? 1 : 0,
                    transitionTimingFunction: EASE,
                  }}
                >
                  <div className="px-3 py-3">
                    <p className="text-sm font-semibold tracking-tight">{item.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {item.year} · {item.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
