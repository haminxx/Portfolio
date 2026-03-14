import { useState } from 'react'
import { Video, VideoOff, Mic, MicOff, PhoneOff, User } from 'lucide-react'
import './FaceTimeWindow.css'

const PLACEHOLDER_CONTACTS = [
  { id: 1, name: 'Contact 1', status: 'Available' },
  { id: 2, name: 'Contact 2', status: 'Busy' },
  { id: 3, name: 'Contact 3', status: 'Available' },
]

export default function FaceTimeWindow() {
  const [videoOn, setVideoOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)

  return (
    <div className="facetime-window">
      <header className="facetime-window__header">
        <h1 className="facetime-window__title">FaceTime</h1>
      </header>
      <div className="facetime-window__body">
        <aside className="facetime-window__sidebar">
          <h2 className="facetime-window__sidebar-title">Contacts</h2>
          <ul className="facetime-window__contact-list">
            {PLACEHOLDER_CONTACTS.map((c) => (
              <li
                key={c.id}
                className={`facetime-window__contact-item ${selectedContact?.id === c.id ? 'facetime-window__contact-item--selected' : ''}`}
                onClick={() => setSelectedContact(c)}
              >
                <span className="facetime-window__contact-avatar">
                  <User size={20} />
                </span>
                <div className="facetime-window__contact-info">
                  <span className="facetime-window__contact-name">{c.name}</span>
                  <span className="facetime-window__contact-status">{c.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <main className="facetime-window__main">
          <div className="facetime-window__video-area">
            {videoOn ? (
              <div className="facetime-window__video-preview">
                <span className="facetime-window__video-placeholder">Video preview</span>
              </div>
            ) : (
              <div className="facetime-window__video-off">
                <VideoOff size={48} />
                <span>Camera off</span>
              </div>
            )}
          </div>
          <div className="facetime-window__controls">
            <button
              type="button"
              className={`facetime-window__control-btn ${!videoOn ? 'facetime-window__control-btn--active' : ''}`}
              onClick={() => setVideoOn((v) => !v)}
              title={videoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
            <button
              type="button"
              className={`facetime-window__control-btn ${!micOn ? 'facetime-window__control-btn--active' : ''}`}
              onClick={() => setMicOn((m) => !m)}
              title={micOn ? 'Mute' : 'Unmute'}
            >
              {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button
              type="button"
              className="facetime-window__control-btn facetime-window__control-btn--end"
              title="End call"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
