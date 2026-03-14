import { APPS } from '../config/apps'
import { useLanguage } from '../context/LanguageContext'
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
  doom: Film,
}

export default function Dock({ onOpenApp, isChromeMaximized, anyMaximized, openAppWindows = [] }) {
  const { t } = useLanguage()
  const doomOpen = openAppWindows.some((w) => w.appKey === 'doom')
  const dockApps = Object.entries(APPS).filter(([key]) => key !== 'doom' || doomOpen)
  const isHidden = anyMaximized ?? isChromeMaximized

  return (
    <div className={`dock-wrapper ${isHidden ? 'dock-wrapper--fullscreen-hidden' : ''}`}>
      <footer className="dock">
      <div className="dock__inner">
        {dockApps.map(([key, app]) => {
          const Icon = APP_ICONS[key] ?? Film
          return (
            <button
              key={key}
              type="button"
              className="dock__item"
              onClick={() => onOpenApp(key)}
              title={t(`apps.${key}`)}
              aria-label={t(`apps.${key}`)}
            >
              <span className="dock__icon">
                {app.iconPath ? (
                  <img src={app.iconPath} alt="" className="dock__icon-img" />
                ) : Icon ? (
                  <Icon size={26} strokeWidth={1.6} />
                ) : null}
              </span>
              <span className="dock__label">{t(`apps.${key}`)}</span>
            </button>
          )
        })}
      </div>
    </footer>
    </div>
  )
}
