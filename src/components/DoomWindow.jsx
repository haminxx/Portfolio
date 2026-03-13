import { useEffect, useRef } from 'react'
import './DoomWindow.css'

const JS_DOS_SCRIPT = 'https://js-dos.com/cdn/js-dos-api.js'

export default function DoomWindow() {
  const containerRef = useRef(null)
  const dosboxRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.id = 'dosbox'

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (typeof window.Dosbox !== 'undefined') {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = JS_DOS_SCRIPT
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    loadScript()
      .then(() => {
        if (typeof window.Dosbox === 'undefined') return
        const dosbox = new window.Dosbox({
          id: 'dosbox',
          onload: (db) => {
            db.run('upload/DOOM-@evilution.zip', './doom')
          },
        })
        dosboxRef.current = dosbox
      })
      .catch(() => {
        console.warn('js-dos failed to load')
      })

    return () => {
      dosboxRef.current = null
    }
  }, [])

  return (
    <div className="doom-window" ref={containerRef}>
      <div className="doom-window__placeholder">
        Loading DOOM...
      </div>
    </div>
  )
}
