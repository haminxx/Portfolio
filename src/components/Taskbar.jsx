import { useState } from 'react'
import { APPS } from '../config/apps'
import SystemTray from './SystemTray'
import { Music2, Image, Linkedin, Film } from 'lucide-react'
import './Taskbar.css'

const APP_ICONS = {
  youtube: Music2,
  instagram: Image,
  linkedin: Linkedin,
  netflix: Film,
}

export default function Taskbar({ onOpenApp }) {
  return (
    <footer className="taskbar">
      <div className="taskbar__left">
        <button type="button" className="taskbar__start" aria-label="Start">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Start</span>
        </button>
      </div>
      <div className="taskbar__center">
        {Object.entries(APPS).map(([key, app]) => {
          const Icon = APP_ICONS[key]
          return (
            <button
              key={key}
              type="button"
              className="taskbar__app"
              onClick={() => onOpenApp(key)}
              title={app.label}
              aria-label={app.label}
            >
              {Icon ? <Icon size={22} strokeWidth={1.8} /> : null}
            </button>
          )
        })}
      </div>
      <div className="taskbar__right">
        <SystemTray />
      </div>
    </footer>
  )
}
