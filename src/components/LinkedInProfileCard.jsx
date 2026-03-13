import { useEffect, useRef } from 'react'
import { Linkedin, ExternalLink } from 'lucide-react'
import './LinkedInProfileCard.css'

const LINKEDIN_VANITY = 'christian-j-l'
const LINKEDIN_SCRIPT = 'https://platform.linkedin.com/badges/js/profile.js'

export default function LinkedInProfileCard({ profileUrl }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const existing = document.querySelector(`script[src="${LINKEDIN_SCRIPT}"]`)
    if (existing) {
      if (typeof window.IN !== 'undefined' && window.IN.parse) {
        window.IN.parse(containerRef.current)
      }
      return
    }

    const script = document.createElement('script')
    script.src = LINKEDIN_SCRIPT
    script.async = true
    script.defer = true
    script.type = 'text/javascript'
    script.onload = () => {
      if (typeof window.IN !== 'undefined' && window.IN.parse && containerRef.current) {
        window.IN.parse(containerRef.current)
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="social-profile-card social-profile-card--linkedin">
      <div ref={containerRef} className="linkedin-badge-container">
        <div
          className="badge-base LI-profile-badge"
          data-locale="en_US"
          data-size="large"
          data-theme="light"
          data-type="VERTICAL"
          data-vanity={LINKEDIN_VANITY}
          data-version="v1"
        >
          <a
            className="badge-base__link LI-simple-link"
            href={`https://linkedin.com/in/${LINKEDIN_VANITY}?trk=profile-badge`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Loading LinkedIn profile...
          </a>
        </div>
      </div>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-profile-card__link"
        >
          <Linkedin size={16} />
          View full profile on LinkedIn
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}
