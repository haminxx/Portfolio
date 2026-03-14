import { Search, User, Folder, Mail, Linkedin, Github } from 'lucide-react'
import { SHORTCUTS } from '../config/shortcuts'
import { useLanguage } from '../context/LanguageContext'
import './ChromeHome.css'

const SHORTCUT_ICONS = {
  user: User,
  folder: Folder,
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
}

export default function ChromeHome({ onShortcut }) {
  const { t } = useLanguage()
  return (
    <div className="chrome-home">
      <div className="chrome-home__search-wrap">
        <Search size={20} className="chrome-home__search-icon" strokeWidth={2} />
        <input
          type="text"
          className="chrome-home__search"
          placeholder={t('chrome.searchPlaceholder')}
          aria-label="Search"
        />
      </div>
      <div className="chrome-home__shortcuts">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICONS[s.icon] || Folder
          const label = t(`shortcuts.${s.type}`)
          return (
            <button
              key={s.id}
              type="button"
              className="chrome-home__shortcut"
              onClick={() => onShortcut?.(s.type)}
              title={label}
              aria-label={label}
            >
              <span className="chrome-home__shortcut-icon">
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span className="chrome-home__shortcut-label">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
