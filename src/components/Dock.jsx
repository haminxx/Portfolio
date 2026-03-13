import { APPS } from '../config/apps'
import { Music2, Image, Linkedin, Film, Monitor } from 'lucide-react'
import './Dock.css'

const APP_ICONS = {
  youtube: Music2,
  instagram: Image,
  linkedin: Linkedin,
  netflix: Film,
}

export default function Dock({ onOpenApp, isChromeMinimized, onRestoreChrome }) {
  return (
    <footer className="dock">
      <div className="dock__inner">
        {isChromeMinimized && (
          <button
            type="button"
            className="dock__item"
            onClick={onRestoreChrome}
            title="Restore Portfolio"
            aria-label="Restore Portfolio"
          >
            <span className="dock__icon">
              <Monitor size={28} strokeWidth={1.8} />
            </span>
            <span className="dock__label">Portfolio</span>
          </button>
        )}
        {Object.entries(APPS).map(([key, app]) => {
          const Icon = APP_ICONS[key]
          return (
            <button
              key={key}
              type="button"
              className="dock__item"
              onClick={() => onOpenApp(key)}
              title={app.label}
              aria-label={app.label}
            >
              <span className="dock__icon">
                {Icon ? <Icon size={28} strokeWidth={1.8} /> : null}
              </span>
              <span className="dock__label">{app.label}</span>
            </button>
          )
        })}
      </div>
    </footer>
  )
}
