import './DoomWindow.css'

const DOOM_PLAY_URL = 'https://dos.zone/doom-dec-1993'

export default function DoomWindow() {
  return (
    <div className="doom-window doom-window--fallback">
      <iframe
        src={DOOM_PLAY_URL}
        title="DOOM"
        className="doom-window__iframe"
      />
    </div>
  )
}
