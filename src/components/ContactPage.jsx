import './ContactPage.css'

export default function ContactPage() {
  return (
    <div className="contact-page">
      <h1 className="contact-page__title">Contact</h1>
      <div className="contact-page__content">
        <p>Get in touch for collaborations, opportunities, or just to say hello.</p>
        <div className="contact-page__info">
          <div className="contact-page__row">
            <span className="contact-page__label">Email</span>
            <a href="mailto:hello@example.com">hello@example.com</a>
          </div>
          <div className="contact-page__row">
            <span className="contact-page__label">LinkedIn</span>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">linkedin.com/in/...</a>
          </div>
          <div className="contact-page__row">
            <span className="contact-page__label">GitHub</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">github.com/...</a>
          </div>
        </div>
        <div className="contact-page__form-placeholder">
          <p>Contact form coming soon.</p>
        </div>
      </div>
    </div>
  )
}
