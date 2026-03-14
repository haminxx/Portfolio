import { useState } from 'react'
import { Search } from 'lucide-react'
import './SettingsWindow.css'

const SECTIONS = [
  { id: 'general', label: 'General', content: 'General settings for your portfolio. Configure default behaviors and preferences.' },
  { id: 'appearance', label: 'Appearance', content: 'Customize the look and feel. Theme, accent colors, and display options.' },
  { id: 'notifications', label: 'Notifications', content: 'Manage notification preferences. Choose what alerts you receive.' },
  { id: 'privacy', label: 'Privacy & Security', content: 'Privacy and security settings. Control data and access.' },
  { id: 'desktop', label: 'Desktop & Dock', content: 'Desktop background, icon size, and dock behavior.' },
  { id: 'displays', label: 'Displays', content: 'Display resolution, brightness, and multiple monitor settings.' },
]

export default function SettingsWindow() {
  const [activeSection, setActiveSection] = useState('general')

  const section = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="settings-window">
      <header className="settings-window__header">
        <div className="settings-window__search-wrap">
          <Search size={16} className="settings-window__search-icon" />
          <input
            type="search"
            placeholder="Search"
            className="settings-window__search"
            readOnly
          />
        </div>
      </header>
      <div className="settings-window__body">
        <aside className="settings-window__sidebar">
          <nav className="settings-window__nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-window__nav-item ${activeSection === s.id ? 'settings-window__nav-item--active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="settings-window__main">
          <h2 className="settings-window__section-title">{section?.label}</h2>
          <div className="settings-window__section-content">
            <p>{section?.content}</p>
            <div className="settings-window__option">
              <span className="settings-window__option-label">Option 1</span>
              <div className="settings-window__option-control" />
            </div>
            <div className="settings-window__option">
              <span className="settings-window__option-label">Option 2</span>
              <div className="settings-window__option-control" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
