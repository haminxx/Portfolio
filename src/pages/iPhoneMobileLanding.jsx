import { useState, useRef, useCallback, useEffect } from 'react'
import {
  User,
  Folder,
  Mail,
  Linkedin,
  Github,
  Image,
  Phone,
  MessageCircle,
  Camera,
  Globe,
} from 'lucide-react'
import { SHORTCUTS } from '../config/shortcuts'
import './iPhoneMobileLanding.css'

const MOBILE_ICONS = {
  user: User,
  folder: Folder,
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  instagram: Image,
  phone: Phone,
  messages: MessageCircle,
  camera: Camera,
  safari: Globe,
}

const EXTRA_APPS = [
  { id: 'phone', label: 'Phone', icon: 'phone', type: 'phone' },
  { id: 'messages', label: 'Messages', icon: 'messages', type: 'messages' },
  { id: 'camera', label: 'Camera', icon: 'camera', type: 'camera' },
  { id: 'safari', label: 'Safari', icon: 'safari', type: 'safari' },
]

const APPS_PER_PAGE = 8
const COLS = 4

function getTimeString() {
  const d = new Date()
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function iPhoneMobileLanding() {
  const [pageIndex, setPageIndex] = useState(0)
  const [time, setTime] = useState(getTimeString())
  const scrollRef = useRef(null)
  const touchStartRef = useRef(0)
  const touchEndRef = useRef(0)

  const allApps = [...SHORTCUTS, ...EXTRA_APPS]
  const totalPages = Math.ceil(allApps.length / APPS_PER_PAGE) || 1

  const handleShortcut = useCallback((type) => {
    const shortcut = SHORTCUTS.find((s) => s.type === type)
    if (shortcut?.url) {
      window.open(shortcut.url, '_blank')
    }
  }, [])

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches?.[0]?.clientX ?? e.clientX
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndRef.current = e.touches?.[0]?.clientX ?? e.clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartRef.current - touchEndRef.current
    const threshold = 50
    if (diff > threshold && pageIndex < totalPages - 1) {
      setPageIndex((p) => p + 1)
    } else if (diff < -threshold && pageIndex > 0) {
      setPageIndex((p) => p - 1)
    }
  }, [pageIndex, totalPages])

  const handleMouseDown = useCallback((e) => {
    touchStartRef.current = e.clientX
  }, [])

  const handleMouseUp = useCallback((e) => {
    touchEndRef.current = e.clientX
    const diff = touchStartRef.current - touchEndRef.current
    const threshold = 50
    if (diff > threshold && pageIndex < totalPages - 1) {
      setPageIndex((p) => p + 1)
    } else if (diff < -threshold && pageIndex > 0) {
      setPageIndex((p) => p - 1)
    }
  }, [pageIndex, totalPages])

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  const pages = []
  for (let p = 0; p < totalPages; p++) {
    const pageApps = allApps.slice(p * APPS_PER_PAGE, (p + 1) * APPS_PER_PAGE)
    pages.push(pageApps)
  }

  const dockApps = [SHORTCUTS.find((s) => s.type === 'contact') || allApps[0], ...SHORTCUTS.filter((s) => ['github', 'linkedin', 'instagram'].includes(s.type))].slice(0, 4)

  return (
    <div className="iphone-mobile">
      <div className="iphone-mobile__status-bar">
        <span className="iphone-mobile__time">{time}</span>
        <div className="iphone-mobile__status-icons">
          <span className="iphone-mobile__signal" aria-hidden />
          <span className="iphone-mobile__wifi" aria-hidden />
          <span className="iphone-mobile__battery" aria-hidden />
        </div>
      </div>

      <div
        className="iphone-mobile__pages"
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className="iphone-mobile__pages-inner"
          style={{
            width: `${totalPages * 100}%`,
            transform: `translateX(${-pageIndex * (100 / totalPages)}%)`,
            transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {pages.map((pageApps, idx) => (
            <div key={idx} className="iphone-mobile__page">
              <div className="iphone-mobile__grid">
                {pageApps.map((app) => {
                  const Icon = MOBILE_ICONS[app.icon] || Folder
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className="iphone-mobile__icon"
                      onClick={() => handleShortcut(app.type)}
                      aria-label={app.label}
                    >
                      <span className="iphone-mobile__icon-bg">
                        <Icon size={28} strokeWidth={1.5} />
                      </span>
                      <span className="iphone-mobile__icon-label">{app.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="iphone-mobile__dots">
        {pages.map((_, idx) => (
          <span
            key={idx}
            className={`iphone-mobile__dot ${idx === pageIndex ? 'iphone-mobile__dot--active' : ''}`}
            aria-hidden
          />
        ))}
      </div>

      <footer className="iphone-mobile__dock">
        {dockApps.map((app) => {
          const Icon = MOBILE_ICONS[app.icon] || Folder
          return (
            <button
              key={app.id}
              type="button"
              className="iphone-mobile__dock-icon"
              onClick={() => handleShortcut(app.type)}
              aria-label={app.label}
            >
              <span className="iphone-mobile__dock-icon-bg">
                <Icon size={24} strokeWidth={1.5} />
              </span>
            </button>
          )
        })}
      </footer>
    </div>
  )
}
