import { ExternalLink } from 'lucide-react'
import './DoomWindow.css'

const DOOM_PLAY_URL = 'https://dos.zone/doom-dec-1993'

export default function DoomWindow() {
  return (
    <div className="doom-window doom-window--fallback">
      <div className="doom-window__card">
        <div className="doom-window__icon" aria-hidden>DOOM</div>
        <h2 className="doom-window__title">DOOM (1993)</h2>
        <p className="doom-window__desc">
          Play classic DOOM in your browser via dos.zone.
        </p>
        <a
          href={DOOM_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="doom-window__play-btn"
        >
          <ExternalLink size={18} />
          Play DOOM
        </a>
      </div>
    </div>
  )
}
