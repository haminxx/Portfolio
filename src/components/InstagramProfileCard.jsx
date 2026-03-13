import { Image, ExternalLink } from 'lucide-react'
import './InstagramProfileCard.css'

// Custom card - no API. Update these to match your profile.
const INSTAGRAM_USER = '85liez'
const INSTAGRAM_BIO = 'Follow for updates and behind-the-scenes.'
const INSTAGRAM_AVATAR = 'https://via.placeholder.com/150/1a1a1a/ffffff?text=IG' // Replace with your profile pic URL

export default function InstagramProfileCard({ profileUrl }) {
  return (
    <div className="social-profile-card social-profile-card--instagram">
      <div className="social-profile-card__header">
        <div className="social-profile-card__avatar-wrap">
          <img
            src={INSTAGRAM_AVATAR}
            alt={`${INSTAGRAM_USER} avatar`}
            className="social-profile-card__avatar"
          />
        </div>
        <div className="social-profile-card__info">
          <h2 className="social-profile-card__name">@{INSTAGRAM_USER}</h2>
          {INSTAGRAM_BIO && <p className="social-profile-card__bio">{INSTAGRAM_BIO}</p>}
        </div>
      </div>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-profile-card__link"
        >
          <Image size={16} />
          View profile on Instagram
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}
