import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import './SettingsWindow.css'

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'desktop', label: 'Desktop & Dock' },
  { id: 'displays', label: 'Displays' },
]

const BACKGROUND_CARDS = [
  { id: 'default', label: 'Default', placeholder: true },
  { id: 'gradient', label: 'Gradient', placeholder: true },
  { id: 'minimal', label: 'Minimal', placeholder: true },
  { id: 'custom', label: 'Custom', placeholder: true },
]

export default function SettingsWindow() {
  const [activeSection, setActiveSection] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [startupFullscreen, setStartupFullscreen] = useState(false)
  const { nightMode, setNightMode, accentColor, setAccentColor, accentColors } = useTheme()
  const { language, setLanguage, languages } = useLanguage()

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            {activeSection === 'general' && (
              <>
                <p>General settings for your portfolio. Configure default behaviors and preferences.</p>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Language</span>
                  <select
                    className="settings-window__select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Start in full screen</span>
                  <button
                    type="button"
                    className={`settings-window__toggle ${startupFullscreen ? 'settings-window__toggle--on' : ''}`}
                    onClick={() => setStartupFullscreen((v) => !v)}
                    aria-pressed={startupFullscreen}
                  >
                    <span className="settings-window__toggle-knob" />
                  </button>
                </div>
              </>
            )}
            {activeSection === 'appearance' && (
              <>
                <p>Customize the look and feel. Theme, accent colors, and display options.</p>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Appearance</span>
                  <div className="settings-window__theme-options">
                    <button
                      type="button"
                      className={`settings-window__theme-btn ${!nightMode ? 'settings-window__theme-btn--active' : ''}`}
                      onClick={() => setNightMode(false)}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className={`settings-window__theme-btn ${nightMode ? 'settings-window__theme-btn--active' : ''}`}
                      onClick={() => setNightMode(true)}
                    >
                      Dark
                    </button>
                  </div>
                </div>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Accent color</span>
                  <div className="settings-window__accent-grid">
                    {accentColors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`settings-window__accent-btn ${accentColor === c.id ? 'settings-window__accent-btn--active' : ''}`}
                        style={{ '--accent': c.value }}
                        onClick={() => setAccentColor(c.id)}
                        title={c.label}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Background image style</span>
                  <div className="settings-window__bg-cards">
                    {BACKGROUND_CARDS.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className="settings-window__bg-card"
                        title={card.label}
                      >
                        <span className="settings-window__bg-card-inner" />
                        <span className="settings-window__bg-card-label">{card.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {activeSection === 'notifications' && (
              <>
                <p>Manage notification preferences. Choose what alerts you receive.</p>
                <div className="settings-window__option">
                  <span className="settings-window__option-label">Enable notifications</span>
                  <button
                    type="button"
                    className={`settings-window__toggle ${notificationsEnabled ? 'settings-window__toggle--on' : ''}`}
                    onClick={() => setNotificationsEnabled((v) => !v)}
                    aria-pressed={notificationsEnabled}
                  >
                    <span className="settings-window__toggle-knob" />
                  </button>
                </div>
              </>
            )}
            {activeSection === 'privacy' && (
              <p>Privacy and security settings. Control data and access.</p>
            )}
            {activeSection === 'desktop' && (
              <p>Desktop background, icon size, and dock behavior.</p>
            )}
            {activeSection === 'displays' && (
              <p>Display resolution, brightness, and multiple monitor settings.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
