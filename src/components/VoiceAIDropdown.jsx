import { useState, useRef, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import './VoiceAIDropdown.css'

/**
 * Pathway for custom voice AI agent:
 * - When ready, connect openVoiceAI() to your agent (e.g. API/WebSocket).
 * - Placeholder buttons below are for "Start conversation" and "Settings".
 * - Add your integration in a new hook or context and call it from the button handlers.
 */
function openVoiceAI() {
  // TODO: Connect to your voice AI agent (API / WebSocket). Leave pathway; do not implement yet.
}

export default function VoiceAIDropdown() {
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  return (
    <div className="voice-ai" ref={boxRef}>
      <button
        type="button"
        className="voice-ai__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Voice AI"
      >
        <Sparkles size={18} strokeWidth={2} />
      </button>
      {open && (
        <div className="voice-ai__dropdown">
          <button type="button" className="voice-ai__item" onClick={() => { openVoiceAI(); setOpen(false); }}>
            Start conversation
          </button>
          <button type="button" className="voice-ai__item">
            Settings
          </button>
        </div>
      )}
    </div>
  )
}
