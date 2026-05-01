import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { TegakiRenderer } from 'tegaki/react'
import tangerine from 'tegaki/fonts/tangerine'
import { useLanguage } from '../context/LanguageContext'
import './PreLanding.css'

const PHASES = ['nameInput', 'handwriting', 'exiting']

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
  const inputRef = useRef(null)
  const { t } = useLanguage()

  const phase = PHASES[phaseIndex]

  const greetingLine = useMemo(() => {
    if (!visitorNameFinal) return ''
    return `Hello, ${visitorNameFinal}`
  }, [visitorNameFinal])

  const handleNameSubmit = useCallback(
    (e) => {
      e?.preventDefault()
      if (phase !== 'nameInput') return
      const trimmed = nameDraft.trim()
      if (!trimmed) return
      setVisitorNameFinal(formatVisitorName(nameDraft))
      setPhaseIndex(1)
    },
    [phase, nameDraft],
  )

  useEffect(() => {
    if (phase === 'nameInput') inputRef.current?.focus()
  }, [phase])

  const handleHandwritingComplete = useCallback(() => {
    if (exitingTimerRef.current != null) window.clearTimeout(exitingTimerRef.current)
    const pauseMs = 700
    exitingTimerRef.current = window.setTimeout(() => {
      setPhaseIndex(2)
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
    const tm = window.setTimeout(() => onEnterDesktop?.(), fadeMs)
    return () => window.clearTimeout(tm)
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
      onEnterDesktop?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEnterDesktop])

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
      <div className="pre-landing__bg" aria-hidden />
      <div className="pre-landing__content">
        {phase === 'nameInput' && (
          <div className="pre-landing__name-stack">
            <p className="pre-landing__glass-prompt">{t('preLanding.visitorNamePrompt')}</p>
            <form className="pre-landing__glass" onSubmit={handleNameSubmit}>
              <input
                ref={inputRef}
                id="visitor-name"
                name="visitorName"
                type="text"
                className="pre-landing__glass-input"
                placeholder={t('preLanding.visitorNamePlaceholder')}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value.slice(0, MAX_NAME_LEN))}
                autoComplete="given-name"
                spellCheck={false}
              />
              <button
                type="submit"
                className="pre-landing__glass-arrow"
                disabled={!nameDraft.trim()}
                aria-label={t('preLanding.visitorNameContinue')}
              >
                <ChevronRight size={22} strokeWidth={2.5} />
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
              font={tangerine}
              time={tegakiTime}
              text={greetingLine}
              onComplete={handleHandwritingComplete}
              quality={{ smoothing: true, clipText: 1.15 }}
              effects={{
                globalGradient: {
                  enabled: true,
                  colors: ['rgba(255, 255, 255, 0.97)', 'rgba(250, 240, 220, 0.93)', 'rgba(255, 255, 255, 0.95)'],
                  angle: 10,
                },
                glow: { enabled: true, radius: 3, color: 'rgba(255, 255, 255, 0.2)' },
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
