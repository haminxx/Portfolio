import './AboutPage.css'

export default function AboutPage() {
  return (
    <div className="about-page">
      <h1 className="about-page__title">About</h1>
      <div className="about-page__content">
        <p className="about-page__bio">
          Software developer with a passion for building clean, user-focused applications.
          Experienced in full-stack development, UI/UX design, and cloud technologies.
        </p>
        <section className="about-page__section">
          <h2>Skills</h2>
          <ul>
            <li>JavaScript, TypeScript, React</li>
            <li>Node.js, Express</li>
            <li>CSS, Tailwind, Responsive Design</li>
            <li>Git, CI/CD</li>
          </ul>
        </section>
        <section className="about-page__section">
          <h2>Interests</h2>
          <p>Open source, web performance, accessibility, and exploring new technologies.</p>
        </section>
      </div>
    </div>
  )
}
