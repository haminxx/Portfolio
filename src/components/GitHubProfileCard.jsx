import { useState, useEffect } from 'react'
import { Github, ExternalLink } from 'lucide-react'
import './GitHubProfileCard.css'

const GITHUB_USER = 'haminxx'
const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}`

export default function GitHubProfileCard({ profileUrl }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(GITHUB_API)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div className="social-profile-card social-profile-card--error">
        <p>Could not load GitHub profile.</p>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="social-profile-card__link"
          >
            View on GitHub
          </a>
        )}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="social-profile-card social-profile-card--loading">
        <div className="social-profile-card__spinner" aria-hidden />
        <p>Loading GitHub profile...</p>
      </div>
    )
  }

  return (
    <div className="social-profile-card social-profile-card--github">
      <div className="social-profile-card__header">
        <img
          src={profile.avatar_url}
          alt={`${profile.name || profile.login} avatar`}
          className="social-profile-card__avatar"
        />
        <div className="social-profile-card__info">
          <h2 className="social-profile-card__name">{profile.name || profile.login}</h2>
          <span className="social-profile-card__username">@{profile.login}</span>
          {profile.bio && <p className="social-profile-card__bio">{profile.bio}</p>}
        </div>
      </div>
      <div className="social-profile-card__stats">
        <span>
          <strong>{profile.public_repos}</strong> repos
        </span>
        <span>
          <strong>{profile.followers}</strong> followers
        </span>
        <span>
          <strong>{profile.following}</strong> following
        </span>
      </div>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="social-profile-card__link"
        >
          <Github size={16} />
          View full profile on GitHub
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  )
}
