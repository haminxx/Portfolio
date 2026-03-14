import { useState, useRef, useEffect } from 'react'
import './AppWindow.css'

const MIN_WIDTH = 320
const MIN_HEIGHT = 240

export default function AppWindow({
  id,
  title,
  icon,
  position,
  size = { width: 880, height: 660 },
  isOpening,
  onOpeningComplete,
  onPositionChange,
  onSizeChange,
  onClose,
  onMinimize,
  onMinimizeComplete,
  onMaximize,
  isMaximized,
  isMinimizing,
  isFocused,
  onFocus,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ edge: '', startX: 0, startY: 0, startW: 0, startH: 0, startLeft: 0, startTop: 0 })
  const [isClosing, setIsClosing] = useState(false)
  const [openingPhase, setOpeningPhase] = useState('dock')
  const dragRef = useRef({ startX: 0, startY: 0, startLeft: 0, startTop: 0 })

  useEffect(() => {
    if (!isOpening) return
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpeningPhase('final'))
    })
    return () => cancelAnimationFrame(t)
  }, [isOpening])

  const handleMouseDown = (e) => {
    if (isMaximized) return
    if (e.target.closest('button')) return
    e.preventDefault()
    onFocus?.()
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

  const handleResizeStart = (e, edge) => {
    e.stopPropagation()
    if (isMaximized) return
    onFocus?.()
    setIsResizing(true)
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
      startLeft: position.x,
      startTop: position.y,
    }
  }

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e) => {
      const { edge, startX, startY, startW, startH, startLeft, startTop } = resizeRef.current
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let w = startW
      let h = startH
      let left = startLeft
      let top = startTop
      if (edge.includes('e')) w = Math.max(MIN_WIDTH, startW + dx)
      else if (edge.includes('w')) {
        const maxDx = startW - MIN_WIDTH
        const clampedDx = Math.min(dx, maxDx)
        w = startW - clampedDx
        left = startLeft + clampedDx
      }
      if (edge.includes('s')) h = Math.max(MIN_HEIGHT, startH + dy)
      else if (edge.includes('n')) {
        const maxDy = startH - MIN_HEIGHT
        const clampedDy = Math.min(dy, maxDy)
        h = startH - clampedDy
        top = startTop + clampedDy
      }
      onSizeChange?.({ width: w, height: h })
      if (left !== startLeft || top !== startTop) {
        onPositionChange?.({ x: left, y: top })
      }
    }
    const handleUp = () => setIsResizing(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isResizing, onSizeChange, onPositionChange])

  useEffect(() => {
    if (!isClosing) return
    const el = document.getElementById(`app-window-${id}`)
    if (!el) return
    const onEnd = () => {
      onClose?.()
    }
    el.addEventListener('animationend', onEnd, { once: true })
    return () => el.removeEventListener('animationend', onEnd)
  }, [isClosing, id, onClose])

  useEffect(() => {
    if (!isMinimizing) return
    const el = document.getElementById(`app-window-${id}`)
    if (!el) return
    const onEnd = () => {
      onMinimizeComplete?.()
    }
    el.addEventListener('animationend', onEnd, { once: true })
    return () => el.removeEventListener('animationend', onEnd)
  }, [isMinimizing, id, onMinimizeComplete])

  const openingCompleteRef = useRef(false)
  const handleOpeningTransitionEnd = (e) => {
    if (!isOpening || openingCompleteRef.current) return
    if (e.propertyName === 'transform' || e.propertyName === 'top' || e.propertyName === 'left') {
      openingCompleteRef.current = true
      onOpeningComplete?.()
    }
  }

  const showOpening = isOpening && openingPhase === 'dock'
  const style = isMaximized
    ? undefined
    : showOpening
      ? {
          left: 'calc(50vw - 320px)',
          top: '100vh',
          width: 640,
          height: 480,
          transform: 'translateY(-20px) scale(0.92)',
        }
      : {
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          transform: 'scale(1)',
        }

  return (
    <div
      id={`app-window-${id}`}
      className={`app-window ${isMaximized ? 'app-window--maximized' : ''} ${isFocused ? 'app-window--focused' : ''} ${isClosing ? 'app-window--closing' : ''} ${isMinimizing ? 'app-window--minimizing' : ''} ${isOpening ? 'app-window--opening' : ''}`}
      style={style}
      onClick={onFocus}
      onTransitionEnd={isOpening ? handleOpeningTransitionEnd : undefined}
    >
      <header
        className="app-window__title"
        onMouseDown={handleMouseDown}
      >
        <div className="app-window__traffic-lights">
          <button
            type="button"
            className="app-window__traffic app-window__traffic--close"
            onClick={(e) => {
              e.stopPropagation()
              if (isClosing) return
              setIsClosing(true)
            }}
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
      {!isMaximized && (
        <>
          <div className="app-window__resize app-window__resize--n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="app-window__resize app-window__resize--s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="app-window__resize app-window__resize--e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="app-window__resize app-window__resize--w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="app-window__resize app-window__resize--nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="app-window__resize app-window__resize--ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="app-window__resize app-window__resize--sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="app-window__resize app-window__resize--se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}
