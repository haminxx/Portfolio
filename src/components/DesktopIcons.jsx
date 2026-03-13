import { APPS } from '../config/apps'
import { Music2, Image, Linkedin, Film } from 'lucide-react'
import './DesktopIcons.css'

const APP_ICONS = {
  youtube: Music2,
  instagram: Image,
  linkedin: Linkedin,
  netflix: Film,
}

export default function DesktopIcons({ onOpenApp }) {
  return (
    <div className="desktop-icons" aria-label="Desktop icons">
      {Object.entries(APPS).map(([key, app]) => {
        const Icon = APP_ICONS[key]
        return (
          <button
            key={key}
            type="button"
            className="desktop-icons__item"
            onClick={() => onOpenApp?.(key)}
            title={app.label}
            aria-label={app.label}
          >
            <span className="desktop-icons__icon">
              {Icon ? <Icon size={40} strokeWidth={1.5} /> : null}
            </span>
            <span className="desktop-icons__label">{app.label}</span>
          </button>
        )
      })}
    </div>
  )
}
