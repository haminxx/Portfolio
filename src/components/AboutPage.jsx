import { useState, useCallback, useRef } from 'react'
import { HandWrittenAboutHero } from './ui/hand-writing-text'
import { SketchOutlineButton } from './ui/sketch-outline-button'
import { playSketchScratch, resumeAboutAudio } from '../lib/aboutSketchAudio'
import './AboutPage.css'

const NAMES = {
  en: 'Christian Lee',
  ko: '이하민',
}

export default function AboutPage() {
  const [reveal, setReveal] = useState(null)
  const audioUnlocked = useRef(false)

  const ensureAudio = useCallback(() => {
    if (audioUnlocked.current) return
    audioUnlocked.current = true
    void resumeAboutAudio()
  }, [])

  const bindLang = useCallback(
    (key) => {
      return {
        onMouseEnter: () => {
          ensureAudio()
          playSketchScratch()
          setReveal(key)
        },
        onMouseLeave: () => setReveal((r) => (r === key ? null : r)),
        onFocus: () => setReveal(key),
        onBlur: () => setReveal((r) => (r === key ? null : r)),
      }
    },
    [ensureAudio],
  )

  const displayName = reveal === 'en' ? NAMES.en : reveal === 'ko' ? NAMES.ko : ''

  return (
    <div
      className="about-page about-page--landing about-page--sketch"
      onPointerDownCapture={() => ensureAudio()}
    >
      <div className="about-page__sketch-paper">
        <div className="about-page__landing-inner">
          <HandWrittenAboutHero
            revealName={displayName}
            title="My name is"
            onEllipseDrawComplete={() => {
              ensureAudio()
              playSketchScratch()
            }}
          />

          <div className="about-page__lang-row">
            <SketchOutlineButton type="button" {...bindLang('en')}>
              English
            </SketchOutlineButton>
            <SketchOutlineButton type="button" {...bindLang('ko')}>
              한국어
            </SketchOutlineButton>
          </div>
        </div>
      </div>
    </div>
  )
}
