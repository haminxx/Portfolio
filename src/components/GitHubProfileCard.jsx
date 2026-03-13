import { useState, useEffect } from 'react'
import { Github, ExternalLink } from 'lucide-react'
import './GitHubProfileCard.css'

const API_URL = import.meta.env.VITE_API_URL || ''
const GITHUB_USER = 'haminxx'

export default function GitHubProfileCard({ profileUrl }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      try {
        if (API_URL) {
          const url = `${API_URL.replace(/\/$/, '')}/api/github`
          const res = await fetch(url)
          if (!res.ok) throw new Error('Failed to load profile')
          const data = await res.json()
          if (!cancelled) setProfile(data)
        } else {
          const [profileRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${GITHUB_USER}`),
            fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=3`),
          ])
          if (!profileRes.ok) throw new Error('Failed to load profile')
          const profileData = await profileRes.json()
          const reposData = reposRes.ok ? await reposRes.json() : []
          if (!cancelled) {
            setProfile({
              avatar_url: profileData.avatar_url,
              login: profileData.login,
              name: profileData.name || profileData.login,
              bio: profileData.bio,
              public_repos: profileData.public_repos,
              followers: profileData.followers,
              following: profileData.following,
              html_url: profileData.html_url,
              repos: reposData.map((r) => ({
                name: r.name,
                html_url: r.html_url,
                description: r.description,
              })),
            })
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    fetchData()
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
      {profile.repos && profile.repos.length > 0 && (
        <div className="social-profile-card__repos">
          <h3 className="social-profile-card__repos-title">Recent Repositories</h3>
          <ul className="social-profile-card__repos-list">
            {profile.repos.map((repo) => (
              <li key={repo.name} className="social-profile-card__repo-item">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-profile-card__repo-link"
                >
                  {repo.name}
                </a>
                {repo.description && (
                  <span className="social-profile-card__repo-desc">{repo.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(profileUrl || profile.html_url) && (
        <a
          href={profileUrl || profile.html_url}
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
