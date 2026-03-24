import { useState, useCallback } from 'react'
import './AboutPage.css'

const HEADLINE_WORDS = ['My', 'Name', 'Is']

const NAMES = {
  en: 'Christian Lee',
  ko: '이하민',
}

export default function AboutPage() {
  const [reveal, setReveal] = useState(null)

  const bindLang = useCallback((key) => {
    const clearIf = (current) => (current === key ? null : current)
    return {
      onMouseEnter: () => setReveal(key),
      onMouseLeave: () => setReveal((r) => clearIf(r)),
      onFocus: () => setReveal(key),
      onBlur: () => setReveal((r) => clearIf(r)),
    }
  }, [])

  const displayName = reveal === 'en' ? NAMES.en : reveal === 'ko' ? NAMES.ko : ''

  return (
    <div className="about-page about-page--landing">
      <div className="about-page__landing-inner">
        <h1 className="about-page__headline">
          {HEADLINE_WORDS.map((word, i) => (
            <span
              key={word}
              className="about-page__word"
              style={{ animationDelay: `${0.08 + i * 0.11}s` }}
            >
              {word}
            </span>
          ))}
        </h1>

        <div className="about-page__name-block">
          <div
            className={`about-page__name ${displayName ? 'about-page__name--visible' : ''}`}
            aria-live="polite"
          >
            {displayName || '\u00a0'}
          </div>
          <div className="about-page__rule" aria-hidden="true" />
        </div>

        <div className="about-page__lang-row">
          <button type="button" className="about-page__lang-btn" {...bindLang('en')}>
            English
          </button>
          <button type="button" className="about-page__lang-btn" {...bindLang('ko')}>
            Korean
          </button>
        </div>
      </div>
    </div>
  )
}
