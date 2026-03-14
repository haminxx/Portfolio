import { Linkedin, ExternalLink, Briefcase, MapPin } from 'lucide-react'
import './LinkedInProfileCard.css'

const LINKEDIN_VANITY = 'christian-j-l'
const PROFILE_URL = `https://linkedin.com/in/${LINKEDIN_VANITY}`

const STATIC_DATA = {
  name: 'Christian Lee',
  headline: 'Software Developer | Full-Stack | React & Node.js',
  about: 'Passionate about building clean, user-focused applications. Experienced in full-stack development, UI/UX design, and cloud technologies.',
  location: 'California, US',
  experience: [
    { title: 'Software Developer', company: 'Company', period: '2022 – Present' },
    { title: 'Developer', company: 'Previous Role', period: '2020 – 2022' },
  ],
}

export default function LinkedInProfileCard({ profileUrl }) {
  const url = profileUrl || PROFILE_URL

  return (
    <div className="linkedin-card">
      <div className="linkedin-card__banner" />
      <div className="linkedin-card__profile-section">
        <div className="linkedin-card__avatar-wrap">
          <div className="linkedin-card__avatar" aria-hidden>
            <span className="linkedin-card__avatar-initials">
              {STATIC_DATA.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
        </div>
        <h1 className="linkedin-card__name">{STATIC_DATA.name}</h1>
        <p className="linkedin-card__headline">{STATIC_DATA.headline}</p>
        {STATIC_DATA.location && (
          <p className="linkedin-card__location">
            <MapPin size={16} strokeWidth={1.5} />
            {STATIC_DATA.location}
          </p>
        )}
      </div>
      <div className="linkedin-card__content">
        <section className="linkedin-card__section">
          <h2 className="linkedin-card__section-title">About</h2>
          <p className="linkedin-card__about">{STATIC_DATA.about}</p>
        </section>
        <section className="linkedin-card__section">
          <h2 className="linkedin-card__section-title">
            <Briefcase size={20} strokeWidth={1.5} />
            Experience
          </h2>
          <div className="linkedin-card__experience-list">
            {STATIC_DATA.experience.map((exp, i) => (
              <div key={i} className="linkedin-card__experience-item">
                <h3 className="linkedin-card__exp-title">{exp.title}</h3>
                <p className="linkedin-card__exp-company">{exp.company}</p>
                <p className="linkedin-card__exp-period">{exp.period}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="linkedin-card__link"
      >
        <Linkedin size={18} strokeWidth={1.5} />
        View full profile on LinkedIn
        <ExternalLink size={14} strokeWidth={1.5} />
      </a>
    </div>
  )
}
