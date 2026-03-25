import { useLanguage } from '../context/LanguageContext'
import './AboutPage.css'

export default function AboutPage({ onLanguageContinue }) {
  const { t } = useLanguage()

  return (
    <div className="about-page about-page--simple">
      <div className="about-page__panel">
        <h1 className="about-page__title">{t('shortcuts.about')}</h1>
        <p className="about-page__intro">{t('aboutPage.intro')}</p>
        <div className="about-page__lang-row">
          <button
            type="button"
            className="about-page__btn"
            onClick={() => onLanguageContinue?.('en')}
          >
            English
          </button>
          <button
            type="button"
            className="about-page__btn"
            onClick={() => onLanguageContinue?.('ko')}
          >
            한국어
          </button>
        </div>
      </div>
    </div>
  )
}
