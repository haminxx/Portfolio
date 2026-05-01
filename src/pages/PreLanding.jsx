import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Globe, ChevronRight } from 'lucide-react'
import { TegakiRenderer } from 'tegaki/react'
import italianno from 'tegaki/fonts/italianno'
import { useLanguage } from '../context/LanguageContext'
import './PreLanding.css'

const PHASES = ['language', 'nameInput', 'handwriting', 'exiting']

const MAX_NAME_LEN = 48

/** Sanitize and lightly title-case for display / Tegaki. */
function formatVisitorName(raw) {
  const collapsed = raw.trim().replace(/\s+/g, ' ')
  const stripped = collapsed.replace(/[^\p{L}\p{M}\p{N}\s.'-]/gu, '').slice(0, MAX_NAME_LEN)
  if (!stripped) return 'Friend'
  return stripped.replace(/\p{L}+/gu, (w) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLowerCase())
}

function greetingDurationSeconds(text) {
  const len = [...text].length
  const base = 3.2
  const perChar = 0.07
  return Math.min(Math.max(base + len * perChar, 4), 14)
}

export default function PreLanding({ onEnterDesktop, onEnterMobile }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [nameDraft, setNameDraft] = useState('')
  const [visitorNameFinal, setVisitorNameFinal] = useState(null)
  const [showMobileButton, setShowMobileButton] = useState(false)
  const exitingTimerRef = useRef(null)
  const { language, setLanguage, languages, t } = useLanguage()

  const phase = PHASES[phaseIndex]

  const greetingLine = useMemo(() => {
    if (!visitorNameFinal) return ''
    return `Hello, ${visitorNameFinal}`
  }, [visitorNameFinal])

  const handleLanguageContinue = useCallback(() => {
    if (phase !== 'language') return
    setPhaseIndex(1)
  }, [phase])

  const handleNameSubmit = useCallback(
    (e) => {
      e?.preventDefault()
      if (phase !== 'nameInput') return
      setVisitorNameFinal(formatVisitorName(nameDraft))
      setPhaseIndex(2)
    },
    [phase, nameDraft],
  )

  const handleHandwritingComplete = useCallback(() => {
    if (exitingTimerRef.current != null) window.clearTimeout(exitingTimerRef.current)
    const pauseMs = 700
    exitingTimerRef.current = window.setTimeout(() => {
      setPhaseIndex(3)
      exitingTimerRef.current = null
    }, pauseMs)
  }, [])

  useEffect(() => {
    return () => {
      if (exitingTimerRef.current != null) window.clearTimeout(exitingTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'exiting') return
    const fadeMs = 1350
    const t = window.setTimeout(() => onEnterDesktop?.(), fadeMs)
    return () => window.clearTimeout(t)
  }, [phase, onEnterDesktop])

  useEffect(() => {
    if (phase !== 'nameInput') return
    setShowMobileButton(false)
    const t = window.setTimeout(() => setShowMobileButton(true), 700)
    return () => window.clearTimeout(t)
  }, [phase])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'F11') return
      e.preventDefault()
      if (phase === 'language') {
        setPhaseIndex(1)
        return
      }
      onEnterDesktop?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, onEnterDesktop])

  const handleMobileEnter = () => onEnterMobile?.()

  const isExiting = phase === 'exiting'

  const tegakiTime = useMemo(() => {
    if (!greetingLine) return { mode: 'uncontrolled', duration: 6 }
    return {
      mode: 'uncontrolled',
      duration: greetingDurationSeconds(greetingLine),
      delay: 0.08,
      playing: true,
      loop: false,
    }
  }, [greetingLine])

  return (
    <div className={`pre-landing pre-landing--${phase} ${isExiting ? 'pre-landing--exiting-fade' : ''}`}>
      <div className="pre-landing__bg" />
      {phase === 'language' && (
        <div className="pre-landing__language-wrap">
          <div className="pre-landing__language-modal">
            <div className="pre-landing__language-icon">
              <Globe size={48} strokeWidth={1.5} />
            </div>
            <h2 className="pre-landing__language-title">{t('preLanding.language')}</h2>
            <div className="pre-landing__language-list">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`pre-landing__language-item ${language === lang.id ? 'pre-landing__language-item--selected' : ''}`}
                  onClick={() => setLanguage(lang.id)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pre-landing__language-continue"
              onClick={handleLanguageContinue}
              aria-label="Continue"
            >
              <ChevronRight size={24} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
      <div className="pre-landing__content">
        {phase === 'nameInput' && (
          <div className="pre-landing__name-card">
            <h2 className="pre-landing__name-title">{t('preLanding.visitorNamePrompt')}</h2>
            <form className="pre-landing__name-form" onSubmit={handleNameSubmit}>
              <input
                id="visitor-name"
                name="visitorName"
                type="text"
                className="pre-landing__name-input"
                placeholder={t('preLanding.visitorNamePlaceholder')}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value.slice(0, MAX_NAME_LEN))}
                autoComplete="given-name"
                autoFocus
              />
              <button type="submit" className="pre-landing__name-submit">
                {t('preLanding.visitorNameContinue')}
              </button>
            </form>
            <div className={`pre-landing__mobile-wrap ${showMobileButton ? 'pre-landing__mobile-wrap--visible' : ''}`}>
              <button type="button" className="pre-landing__mobile-btn" onClick={handleMobileEnter}>
                {t('preLanding.mobileUser')}
              </button>
            </div>
          </div>
        )}
        {phase === 'handwriting' && visitorNameFinal && (
          <div className="pre-landing__tegaki-wrap" aria-live="polite">
            <TegakiRenderer
              key={greetingLine}
              font={italianno}
              time={tegakiTime}
              text={greetingLine}
              onComplete={handleHandwritingComplete}
              quality={{ smoothing: true, clipText: 1.15 }}
              effects={{
                globalGradient: {
                  enabled: true,
                  colors: ['rgba(255, 255, 255, 0.97)', 'rgba(210, 230, 255, 0.92)', 'rgba(255, 255, 255, 0.95)'],
                  angle: 12,
                },
                glow: { enabled: true, radius: 3, color: 'rgba(255, 255, 255, 0.22)' },
              }}
              className="pre-landing__tegaki"
              style={{
                fontSize: 'clamp(2.25rem, 9vw, 3.75rem)',
                color: 'rgba(255, 255, 255, 0.96)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
