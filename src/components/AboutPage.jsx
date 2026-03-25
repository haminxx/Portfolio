import { useState, useCallback } from 'react'
import { HandWrittenAboutHero } from './ui/hand-writing-text'
import './AboutPage.css'

const NAMES = {
  en: 'Christian Lee',
  ko: '이하민',
}

export default function AboutPage() {
  const [reveal, setReveal] = useState(null)

  const bindLang = useCallback((key) => {
    return {
      onMouseEnter: () => setReveal(key),
      onMouseLeave: () => setReveal((r) => (r === key ? null : r)),
      onFocus: () => setReveal(key),
      onBlur: () => setReveal((r) => (r === key ? null : r)),
    }
  }, [])

  const displayName =
    reveal === 'en' ? NAMES.en : reveal === 'ko' ? NAMES.ko : ''

  return (
    <div className="about-page about-page--landing">
      <div className="about-page__landing-inner">
        <HandWrittenAboutHero revealName={displayName} title="My name is" />

        <div className="about-page__lang-row">
          <button
            type="button"
            className="about-page__lang-btn"
            {...bindLang('en')}
          >
            English
          </button>
          <button
            type="button"
            className="about-page__lang-btn"
            {...bindLang('ko')}
          >
            한국어
          </button>
        </div>
      </div>
    </div>
  )
}
