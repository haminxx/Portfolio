import { useState, useRef, useCallback, useEffect } from 'react'
import './ChromeWindow.css'

export default function ChromeWindow({ isMaximized, onMaximize, children }) {
  const winRef = useRef(null)
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? (window.innerWidth - Math.min(1200, window.innerWidth * 0.7)) / 2 : 0,
    y: typeof window !== 'undefined' ? (window.innerHeight - Math.min(800, window.innerHeight * 0.7)) / 2 : 0,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 })

  const handleMouseDown = useCallback((e) => {
    if (isMaximized) return
    const target = e.target
    if (target.closest('button') || target.closest('a') || target.closest('input')) return
    if (!target.closest('.chrome-frame')) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: position.x,
      top: position.y,
    }
  }, [isMaximized, position])

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPosition({
        x: Math.max(0, dragStartRef.current.left + dx),
        y: Math.max(0, dragStartRef.current.top + dy),
      })
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging])

  const style = isMaximized
    ? undefined
    : { left: position.x, top: position.y, transform: 'none' }

  return (
    <div
      ref={winRef}
      className={`chrome-window ${isMaximized ? 'chrome-window--maximized' : ''} ${isDragging ? 'chrome-window--dragging' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div className="chrome-window__inner">
        {children}
      </div>
    </div>
  )
}
