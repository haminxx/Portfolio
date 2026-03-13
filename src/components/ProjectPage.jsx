import './ProjectPage.css'

const PROJECTS = [
  { title: 'Portfolio Website', desc: 'Chrome-style portfolio with dock, windows, and app integrations.' },
  { title: 'Task Manager', desc: 'Full-stack task management app with real-time updates.' },
  { title: 'API Dashboard', desc: 'Monitoring dashboard for API health and analytics.' },
]

export default function ProjectPage() {
  return (
    <div className="project-page">
      <h1 className="project-page__title">Projects</h1>
      <div className="project-page__list">
        {PROJECTS.map((p, i) => (
          <div key={i} className="project-page__item">
            <h3 className="project-page__item-title">{p.title}</h3>
            <p className="project-page__item-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
