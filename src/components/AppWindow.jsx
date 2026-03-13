import { useState, useRef, useEffect } from 'react'
import './AppWindow.css'

export default function AppWindow({
  id,
  title,
  icon,
  position,
  onPositionChange,
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
  isFocused,
  onFocus,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 })

  const handleMouseDown = (e) => {
    if (isMaximized) return
    if (e.target.closest('button')) return
    e.preventDefault()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
    }
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      onPositionChange?.({
        x: dragRef.current.startLeft + dx,
        y: dragRef.current.startTop + dy,
      })
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, onPositionChange])

  const style = isMaximized
    ? undefined
    : { left: position.x, top: position.y }

  return (
    <div
      className={`app-window ${isMaximized ? 'app-window--maximized' : ''} ${isFocused ? 'app-window--focused' : ''}`}
      style={style}
      onClick={onFocus}
    >
      <header
        className="app-window__title"
        onMouseDown={handleMouseDown}
      >
        <div className="app-window__traffic-lights">
          <button
            type="button"
            className="app-window__traffic app-window__traffic--close"
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            aria-label="Close"
          />
          <button
            type="button"
            className="app-window__traffic app-window__traffic--minimize"
            onClick={(e) => { e.stopPropagation(); onMinimize?.(); }}
            aria-label="Minimize"
          />
          <button
            type="button"
            className="app-window__traffic app-window__traffic--maximize"
            onClick={(e) => { e.stopPropagation(); onMaximize?.(); }}
            aria-label="Maximize"
          />
        </div>
        {icon && <span className="app-window__icon">{icon}</span>}
        <span className="app-window__title-text">{title}</span>
      </header>
      <div className="app-window__content">
        {children}
      </div>
    </div>
  )
}
