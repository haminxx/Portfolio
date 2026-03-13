import { Search, User, Folder, Mail, Linkedin, Github, Image } from 'lucide-react'
import { SHORTCUTS } from '../config/shortcuts'
import './ChromeHome.css'

const SHORTCUT_ICONS = {
  user: User,
  folder: Folder,
  mail: Mail,
  linkedin: Linkedin,
  github: Github,
  instagram: Image,
}

export default function ChromeHome({ onShortcut }) {
  return (
    <div className="chrome-home">
      <div className="chrome-home__search-wrap">
        <Search size={20} className="chrome-home__search-icon" strokeWidth={2} />
        <input
          type="text"
          className="chrome-home__search"
          placeholder="Search Google or type a URL"
          aria-label="Search"
        />
      </div>
      <div className="chrome-home__shortcuts">
        {SHORTCUTS.map((s) => {
          const Icon = SHORTCUT_ICONS[s.icon] || Folder
          return (
            <button
              key={s.id}
              type="button"
              className="chrome-home__shortcut"
              onClick={() => onShortcut?.(s.type)}
              title={s.label}
              aria-label={s.label}
            >
              <span className="chrome-home__shortcut-icon">
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span className="chrome-home__shortcut-label">{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
