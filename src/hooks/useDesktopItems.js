import { useState, useCallback } from 'react'

const DESKTOP_ITEMS_KEY = 'desktop-items'
const REMOVED_SEED_FOLDER_ID = 'seed-desktop-glass-folder'

function loadDesktopItems() {
  try {
    const raw = localStorage.getItem(DESKTOP_ITEMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveDesktopItems(items) {
  try { localStorage.setItem(DESKTOP_ITEMS_KEY, JSON.stringify(items)) } catch {}
}

function initializeDesktopItems() {
  const GAME_KEYS = new Set(['doom', 'dadnme', 'tetris'])
  const GAME_ROW_Y = 636
  const GAME_ROW_LEGACY_Y = 572

  const loaded = loadDesktopItems()
  const withoutFolder = loaded.filter((i) => i.id !== REMOVED_SEED_FOLDER_ID)
  const removedFolder = withoutFolder.length !== loaded.length
  let next = [...withoutFolder]

  let migratedGameY = false
  next = next.map((i) => {
    if (i.type === 'shortcut' && i.appKey && GAME_KEYS.has(i.appKey) && i.y === GAME_ROW_LEGACY_Y) {
      migratedGameY = true
      return { ...i, y: GAME_ROW_Y }
    }
    return i
  })

  const hasDoom = next.some((i) => i.type === 'shortcut' && i.appKey === 'doom')
  const hasDadnme = next.some((i) => i.type === 'shortcut' && i.appKey === 'dadnme')
  const hasTetris = next.some((i) => i.type === 'shortcut' && i.appKey === 'tetris')

  if (!hasDoom) next = [...next, { id: 'doom-shortcut', type: 'shortcut', name: 'DOOM', appKey: 'doom', parentId: null, x: 24, y: GAME_ROW_Y }]
  if (!hasDadnme) next = [...next, { id: 'dadnme-shortcut', type: 'shortcut', name: "Dad 'n Me", appKey: 'dadnme', parentId: null, x: 120, y: GAME_ROW_Y }]
  if (!hasTetris) next = [...next, { id: 'tetris-shortcut', type: 'shortcut', name: 'Tetris', appKey: 'tetris', parentId: null, x: 216, y: GAME_ROW_Y }]

  if (!hasDoom || !hasDadnme || !hasTetris || removedFolder || migratedGameY) saveDesktopItems(next)
  return next
}

export function useDesktopItems() {
  const [desktopItems, setDesktopItemsState] = useState(initializeDesktopItems)

  const setDesktopItems = useCallback((fnOrValue) => {
    setDesktopItemsState((prev) => {
      const next = typeof fnOrValue === 'function' ? fnOrValue(prev) : fnOrValue
      saveDesktopItems(next)
      return next
    })
  }, [])

  const handleNewFolder = useCallback((x, y) => {
    const id = `folder-${Date.now()}`
    setDesktopItems((prev) => [...prev, { id, type: 'folder', name: 'New Folder', parentId: null, x, y }])
    return id
  }, [setDesktopItems])

  const handleNewFile = useCallback((x, y) => {
    const id = `file-${Date.now()}`
    setDesktopItems((prev) => [...prev, { id, type: 'file', name: 'New File', parentId: null, x, y }])
    return id
  }, [setDesktopItems])

  return { desktopItems, setDesktopItems, handleNewFolder, handleNewFile }
}
