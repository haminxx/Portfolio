import { useState, useRef, useCallback, useEffect } from 'react'
import './ChromeWindow.css'

const MIN_WIDTH = 400
const MIN_HEIGHT = 300

export default function ChromeWindow({ isMaximized, onMaximize, isMinimizing, isOpening, onOpeningComplete, onMinimizeComplete, children }) {
  const winRef = useRef(null)
  const openingCompleteRef = useRef(false)
  const [openingPhase, setOpeningPhase] = useState('dock')
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? (window.innerWidth - Math.min(1200, window.innerWidth * 0.7)) / 2 : 0,
    y: typeof window !== 'undefined' ? (window.innerHeight - Math.min(800, window.innerHeight * 0.7)) / 2 : 0,
  }))
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? Math.min(1200, window.innerWidth * 0.7) : 1000,
    height: typeof window !== 'undefined' ? Math.min(800, window.innerHeight * 0.7) : 700,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 })
  const resizeRef = useRef({ edge: '', startX: 0, startY: 0, startW: 0, startH: 0 })

  useEffect(() => {
    if (!isOpening) return
    openingCompleteRef.current = false
    setOpeningPhase('dock')
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpeningPhase('final'))
    })
    return () => cancelAnimationFrame(t)
  }, [isOpening])

  const handleOpeningTransitionEnd = useCallback((e) => {
    if (!isOpening || openingCompleteRef.current) return
    if (e.propertyName === 'transform' || e.propertyName === 'top' || e.propertyName === 'left') {
      openingCompleteRef.current = true
      onOpeningComplete?.()
    }
  }, [isOpening, onOpeningComplete])

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
      const newX = Math.max(0, dragStartRef.current.left + dx)
      const newY = Math.max(0, dragStartRef.current.top + dy)
      if (winRef.current) {
        winRef.current.style.transform = `translate(${newX - position.x}px, ${newY - position.y}px)`
      }
    }
    const handleUp = (e) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      const newX = Math.max(0, dragStartRef.current.left + dx)
      const newY = Math.max(0, dragStartRef.current.top + dy)
      if (winRef.current) {
        winRef.current.style.transform = ''
      }
      setPosition({ x: newX, y: newY })
      setIsDragging(false)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, position.x, position.y])

  const handleResizeStart = useCallback((e, edge) => {
    e.stopPropagation()
    if (isMaximized) return
    setIsResizing(true)
    resizeRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    }
  }, [isMaximized, size])

  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e) => {
      const { edge, startX, startY, startW, startH } = resizeRef.current
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      let w = startW
      let h = startH
      if (edge.includes('e') || edge === 'se') w = Math.max(MIN_WIDTH, startW + dx)
      if (edge.includes('s') || edge === 'se') h = Math.max(MIN_HEIGHT, startH + dy)
      setSize({ width: w, height: h })
    }
    const handleUp = () => setIsResizing(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isResizing])

  const winWidth = size.width
  const winHeight = size.height
  const showOpening = isOpening && openingPhase === 'dock'
  const style = isMaximized
    ? undefined
    : showOpening
      ? {
          left: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - winWidth / 2,
          top: typeof window !== 'undefined' ? window.innerHeight : 800,
          width: winWidth,
          height: winHeight,
          transform: 'translateY(-20px) scale(0.92)',
        }
      : { left: position.x, top: position.y, width: size.width, height: size.height, transform: 'none' }

  return (
    <div
      ref={winRef}
      id="chrome-window-main"
      className={`chrome-window ${isMaximized ? 'chrome-window--maximized' : ''} ${isDragging ? 'chrome-window--dragging' : ''} ${isMinimizing ? 'chrome-window--minimizing' : ''} ${isOpening ? 'chrome-window--opening' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onTransitionEnd={isOpening ? handleOpeningTransitionEnd : undefined}
      onAnimationEnd={isMinimizing ? (e) => { if (e.target.id === 'chrome-window-main') onMinimizeComplete?.() } : undefined}
    >
      <div className="chrome-window__inner">
        {children}
      </div>
      {!isMaximized && !isMinimizing && (
        <>
          <div className="chrome-window__resize chrome-window__resize--e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="chrome-window__resize chrome-window__resize--s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="chrome-window__resize chrome-window__resize--se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}
