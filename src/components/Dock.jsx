import { APPS } from '../config/apps'
import {
  Globe,
  Image,
  Film,
  Images,
  ShoppingBag,
  Settings,
  Map,
  Monitor,
} from 'lucide-react'
import './Dock.css'

const APP_ICONS = {
  chrome: Globe,
  instagram: Image,
  netflix: Film,
  gallery: Images,
  appStore: ShoppingBag,
  settings: Settings,
  map: Map,
  youtubeMusic: Film,
}

export default function Dock({ onOpenApp, isChromeMinimized, isChromeMaximized, onRestoreChrome }) {
  return (
    <footer className={`dock ${isChromeMaximized ? 'dock--fullscreen-hidden' : ''}`}>
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
        {Object.entries(APPS)
          .filter(([key]) => key !== 'chrome' || isChromeMinimized)
          .map(([key, app]) => {
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
                {app.iconPath ? (
                  <img src={app.iconPath} alt="" className="dock__icon-img" />
                ) : Icon ? (
                  <Icon size={26} strokeWidth={1.6} />
                ) : null}
              </span>
              <span className="dock__label">{app.label}</span>
            </button>
          )
        })}
      </div>
    </footer>
  )
}
