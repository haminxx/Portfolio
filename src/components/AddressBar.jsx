import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Home } from 'lucide-react'
import './AddressBar.css'

function isURL(str) {
  return /^(https?:\/\/|ftp:\/\/)/.test(str) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|$)/.test(str)
}

export default function AddressBar({
  domain,
  onGoHome,
  onBack,
  onForward,
  onRefresh,
  onNavigate,
  canGoBack = true,
  canGoForward = true,
}) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(domain ?? '')
  const inputRef = useRef(null)

  // Sync input value when domain prop changes (e.g. tab switch)
  useEffect(() => {
    if (!editing) setInputValue(domain ?? '')
  }, [domain, editing])

  const handleFocus = () => {
    setEditing(true)
    setInputValue(domain ?? '')
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    setInputValue(domain ?? '')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const raw = inputValue.trim()
      if (!raw) return
      // Navigate or search
      if (isURL(raw)) {
        const url = raw.startsWith('http') ? raw : `https://${raw}`
        onNavigate?.(url, null) // url navigate
      } else {
        onNavigate?.(null, raw) // search query
      }
      setEditing(false)
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setInputValue(domain ?? '')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="address-bar">
      <div className="address-bar__nav">
        <button
          type="button"
          className="address-bar__btn"
          aria-label="Back"
          disabled={!canGoBack}
          aria-disabled={!canGoBack}
          onClick={onBack}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="address-bar__btn"
          aria-label="Forward"
          disabled={!canGoForward}
          aria-disabled={!canGoForward}
          onClick={onForward}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
        <button type="button" className="address-bar__btn" aria-label="Refresh" onClick={onRefresh}>
          <RotateCw size={16} strokeWidth={2.5} />
        </button>
        <button type="button" className="address-bar__btn" aria-label="Home" onClick={onGoHome}>
          <Home size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className={`address-bar__url ${editing ? 'address-bar__url--editing' : ''}`}>
        <input
          ref={inputRef}
          className="address-bar__input"
          value={editing ? inputValue : (domain ?? '')}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label="Address bar"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
