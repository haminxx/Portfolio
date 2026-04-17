import { useState, useCallback } from 'react'
import { APPS } from '../config/apps'

const DOCK_ORDER_KEY = 'dock-order'

function loadDockOrder() {
  try {
    const raw = localStorage.getItem(DOCK_ORDER_KEY)
    if (!raw) return Object.keys(APPS)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Object.keys(APPS)
    const valid = parsed.filter((k) => k in APPS)
    const missing = Object.keys(APPS).filter((k) => !valid.includes(k))
    return [...valid, ...missing]
  } catch {
    return Object.keys(APPS)
  }
}

function saveDockOrder(order) {
  try { localStorage.setItem(DOCK_ORDER_KEY, JSON.stringify(order)) } catch {}
}

export function useDockOrder() {
  const [dockOrder, setDockOrder] = useState(loadDockOrder)

  const updateDockOrder = useCallback((order) => {
    setDockOrder(order)
    saveDockOrder(order)
  }, [])

  return { dockOrder, updateDockOrder }
}
