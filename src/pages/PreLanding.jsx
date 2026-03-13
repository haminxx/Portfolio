import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PreLanding.css'

export default function PreLanding() {
  const navigate = useNavigate()
  const [showMobileButton, setShowMobileButton] = useState(false)

  useEffect(() => {
    setShowMobileButton(false)
    const t = setTimeout(() => setShowMobileButton(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => {
            navigate('/home')
          }).catch(() => navigate('/home'))
        } else {
          navigate('/home')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleMobileEnter = () => {
    navigate('/home')
  }

  return (
    <div className="pre-landing">
      <p className="pre-landing__flash">Press Fn + F11 to Enter</p>
      <div className={`pre-landing__mobile-wrap ${showMobileButton ? 'pre-landing__mobile-wrap--visible' : ''}`}>
        <button type="button" className="pre-landing__mobile-btn" onClick={handleMobileEnter}>
          Mobile User
        </button>
      </div>
    </div>
  )
}
