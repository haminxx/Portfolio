import { ExternalLink } from 'lucide-react'
import './SocialProfileWindow.css'

export default function SocialProfileWindow({ profileUrl, children, cardOnly = false }) {
  return (
    <div className={`social-profile-window ${cardOnly ? 'social-profile-window--card-only' : ''}`}>
      {!cardOnly && (
        <div className="social-profile-window__iframe-wrap">
          {profileUrl && (
            <>
              <iframe
                src={profileUrl}
                className="social-profile-window__iframe"
                title="Profile"
              />
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-profile-window__open-tab"
              >
                <ExternalLink size={16} />
                Open in new tab
              </a>
            </>
          )}
        </div>
      )}
      <div className="social-profile-window__card">
        {children}
      </div>
    </div>
  )
}
