import { useState, useRef, useCallback, useEffect } from 'react'
import './ChromeWindow.css'

const MIN_WIDTH = 400
const MIN_HEIGHT = 300
const MENU_BAR_HEIGHT = 32

export default function ChromeWindow({ isMaximized, onMaximize, isMinimizing, isOpening, onOpeningComplete, onMinimizeComplete, onFocus, isFocused, children }) {
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
  const resizeRef = useRef({ edge: '', startX: 0, startY: 0, startW: 0, startH: 0, startLeft: 0, startTop: 0 })

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
    const isFrame = target.closest('.chrome-frame')
    const isResize = target.closest('.chrome-window__resize')
    const isContent = target.closest('.chrome-landing__content')
    if (!isFrame && !isResize && !isContent) return
    if (isFrame || isResize) {
      if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
        e.preventDefault()
      }
    }
    onFocus?.()
    if (isFrame) setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: position.x,
      top: position.y,
    }
  }, [isMaximized, position, onFocus])

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      const newX = Math.max(0, dragStartRef.current.left + dx)
      const newY = Math.max(MENU_BAR_HEIGHT, dragStartRef.current.top + dy)
      if (winRef.current) {
        winRef.current.style.transform = `translate(${newX - position.x}px, ${newY - position.y}px)`
      }
    }
    const handleUp = (e) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      const newX = Math.max(0, dragStartRef.current.left + dx)
      const newY = Math.max(MENU_BAR_HEIGHT, dragStartRef.current.top + dy)
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
  }, [isMaximized, size, position, onFocus])

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
      else       if (edge.includes('n')) {
        const maxDy = startH - MIN_HEIGHT
        const clampedDy = Math.min(dy, maxDy)
        h = startH - clampedDy
        top = startTop + clampedDy
      }
      setSize({ width: w, height: h })
      setPosition({ x: left, y: Math.max(MENU_BAR_HEIGHT, top) })
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
          left: position.x,
          top: position.y,
          width: winWidth,
          height: winHeight,
          transform: 'scale(0.05) translateY(40vh)',
          opacity: 0,
        }
      : { left: position.x, top: position.y, width: size.width, height: size.height, transform: 'none', opacity: 1 }

  return (
    <div
      ref={winRef}
      id="chrome-window-main"
      className={`chrome-window ${isMaximized ? 'chrome-window--maximized' : ''} ${isFocused ? 'chrome-window--focused' : ''} ${isDragging ? 'chrome-window--dragging' : ''} ${isMinimizing ? 'chrome-window--minimizing' : ''} ${isOpening ? 'chrome-window--opening' : ''}`}
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
          <div className="chrome-window__resize chrome-window__resize--n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="chrome-window__resize chrome-window__resize--s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="chrome-window__resize chrome-window__resize--e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="chrome-window__resize chrome-window__resize--w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="chrome-window__resize chrome-window__resize--nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="chrome-window__resize chrome-window__resize--ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="chrome-window__resize chrome-window__resize--sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="chrome-window__resize chrome-window__resize--se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}
