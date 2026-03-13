import { APPS } from '../config/apps'
import {
  Globe,
  Image,
  Film,
  Images,
  ShoppingBag,
  Settings,
  Map,
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

export default function Dock({ onOpenApp, isChromeMaximized }) {
  return (
    <footer className={`dock ${isChromeMaximized ? 'dock--fullscreen-hidden' : ''}`}>
      <div className="dock__inner">
        {Object.entries(APPS)
          .filter(([key]) => key !== 'doom')
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
