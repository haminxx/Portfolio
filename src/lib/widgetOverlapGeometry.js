/**
 * Shared geometry for desktop widgets vs icons (overlap checks).
 * Must stay in sync with DesktopWidgets.jsx layout model.
 */
import {
  DESKTOP_ICON_WIDTH,
  DESKTOP_ICON_HEIGHT,
  DESKTOP_SAFE_TOP,
} from '../desktopConstants'

const LAYOUT_KEY = 'desktop-widget-layout'
const CELL = 40
const GRID_MIN = 8
const GRID_MAX = 16

const PHOTO_IDS = ['photoA', 'photoB', 'photoC']

export const WIDGET_OVERLAP_IDS = [
  'calendar',
  'clock',
  'weather',
  'music',
  'bgControls',
  'notesChecklist',
  ...PHOTO_IDS,
]

const STATIC_SIZES = {
  calendar: { w: 200, h: 220 },
  clock: { w: 200, h: 120 },
  weather: { w: 200, h: 130 },
  music: { w: 312, h: 136 },
  bgControls: { w: 232, h: 176 },
  notesChecklist: { w: 200, h: 200 },
}

const DEFAULT_LAYOUT = {
  calendar: { x: 20, y: 56 },
  clock: { x: 240, y: 56 },
  weather: { x: 20, y: 300 },
  music: { x: 240, y: 300 },
  bgControls: { x: 20, y: 448 },
  notesChecklist: { x: 480, y: 300 },
  photoA: { x: 480, y: 56, gridW: 8, gridH: 8 },
  photoB: { x: 720, y: 56, gridW: 8, gridH: 8 },
  photoC: { x: 480, y: 360, gridW: 8, gridH: 8 },
}

function clampGrid(n) {
  const v = Math.round(Number(n))
  if (Number.isNaN(v)) return GRID_MIN
  return Math.max(GRID_MIN, Math.min(GRID_MAX, v))
}

function getBoxSize(id, entry) {
  if (PHOTO_IDS.includes(id)) {
    const gw = clampGrid(entry?.gridW ?? GRID_MIN)
    const gh = clampGrid(entry?.gridH ?? GRID_MIN)
    return { w: gw * CELL, h: gh * CELL }
  }
  return STATIC_SIZES[id] || { w: 200, h: 150 }
}

function getWidgetRect(id, entry) {
  const { w, h } = getBoxSize(id, entry)
  const x = entry.x ?? 0
  const y = entry.y ?? 0
  return { left: x, top: y, right: x + w, bottom: y + h }
}

export function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

function mergeLayoutFromStorage(parsed) {
  const out = { ...DEFAULT_LAYOUT }
  if (!parsed || typeof parsed !== 'object') return out
  for (const id of WIDGET_OVERLAP_IDS) {
    if (parsed[id]?.x != null && parsed[id]?.y != null) {
      out[id] = {
        ...out[id],
        x: parsed[id].x,
        y: parsed[id].y,
      }
      if (PHOTO_IDS.includes(id)) {
        if (parsed[id].gridW != null) out[id].gridW = clampGrid(parsed[id].gridW)
        if (parsed[id].gridH != null) out[id].gridH = clampGrid(parsed[id].gridH)
      }
    }
  }
  return out
}

/** Parse saved layout from localStorage (fallback defaults). */
export function loadWidgetLayoutFromStorage() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return { ...DEFAULT_LAYOUT }
    return mergeLayoutFromStorage(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_LAYOUT }
  }
}

/** Axis-aligned rects for all widgets from a layout map (same shape as DesktopWidgets state). */
export function getWidgetRectsFromLayout(layout) {
  if (!layout) return []
  return WIDGET_OVERLAP_IDS.map((id) => {
    const entry = layout[id] || DEFAULT_LAYOUT[id]
    return getWidgetRect(id, entry)
  })
}

export function iconRectFromItem(item) {
  const x = item.x ?? 24
  const y = item.y ?? 24
  return {
    left: x,
    top: y,
    right: x + DESKTOP_ICON_WIDTH,
    bottom: y + DESKTOP_ICON_HEIGHT,
  }
}

export function getDesktopIconRects(desktopItems) {
  if (!Array.isArray(desktopItems)) return []
  return desktopItems.filter((i) => !i.parentId).map(iconRectFromItem)
}

/** Positions map id -> {x,y} for a group of icon ids */
export function groupOverlapsWidgetRects(positions, groupIds, widgetRects) {
  for (const id of groupIds) {
    const p = positions[id]
    if (!p) continue
    const ir = {
      left: p.x,
      top: p.y,
      right: p.x + DESKTOP_ICON_WIDTH,
      bottom: p.y + DESKTOP_ICON_HEIGHT,
    }
    for (const wr of widgetRects) {
      if (rectsOverlap(ir, wr)) return true
    }
  }
  return false
}

/**
 * After dragging desktop icons over widgets/other icons, snap each moved icon to a free spot
 * (same grid search idea as widget nudge).
 */
export function nudgeIconGroupAfterDrop(candidates, groupIds, desktopItems, layoutMap, wrapWidth, wrapHeight) {
  if (!candidates || !groupIds?.length) return candidates
  const widgetRects = getWidgetRectsFromLayout(layoutMap)
  const maxX = Math.max(0, wrapWidth - DESKTOP_ICON_WIDTH)
  const maxY = Math.max(DESKTOP_SAFE_TOP, wrapHeight - DESKTOP_ICON_HEIGHT)
  const out = { ...candidates }

  function overlapsAt(x, y, ignoreId) {
    const ir = {
      left: x,
      top: y,
      right: x + DESKTOP_ICON_WIDTH,
      bottom: y + DESKTOP_ICON_HEIGHT,
    }
    for (const wr of widgetRects) {
      if (rectsOverlap(ir, wr)) return true
    }
    for (const item of desktopItems) {
      if (item.parentId) continue
      if (item.id === ignoreId) continue
      const op = out[item.id] ?? { x: item.x ?? 24, y: item.y ?? 24 }
      const or = {
        left: op.x,
        top: op.y,
        right: op.x + DESKTOP_ICON_WIDTH,
        bottom: op.y + DESKTOP_ICON_HEIGHT,
      }
      if (rectsOverlap(ir, or)) return true
    }
    for (const gid of groupIds) {
      if (gid === ignoreId) continue
      const op = out[gid]
      if (!op) continue
      const or = {
        left: op.x,
        top: op.y,
        right: op.x + DESKTOP_ICON_WIDTH,
        bottom: op.y + DESKTOP_ICON_HEIGHT,
      }
      if (rectsOverlap(ir, or)) return true
    }
    return false
  }

  const step = 8
  for (const id of groupIds) {
    let p = out[id]
    if (!p) continue
    let x = Math.max(0, Math.min(maxX, p.x))
    let y = Math.max(DESKTOP_SAFE_TOP, Math.min(maxY, p.y))
    if (!overlapsAt(x, y, id)) {
      out[id] = { x, y }
      continue
    }
    let found = false
    for (let gy = DESKTOP_SAFE_TOP; gy <= maxY && !found; gy += step) {
      for (let gx = 0; gx <= maxX && !found; gx += step) {
        const cx = Math.max(0, Math.min(maxX, gx))
        const cy = Math.max(DESKTOP_SAFE_TOP, Math.min(maxY, gy))
        if (!overlapsAt(cx, cy, id)) {
          x = cx
          y = cy
          found = true
        }
      }
    }
    out[id] = { x, y }
  }
  return out
}

export function groupOverlapsOtherIcons(positions, groupIds, desktopItems) {
  const groupRects = groupIds
    .map((id) => positions[id])
    .filter(Boolean)
    .map((p) => ({
      left: p.x,
      top: p.y,
      right: p.x + DESKTOP_ICON_WIDTH,
      bottom: p.y + DESKTOP_ICON_HEIGHT,
    }))
  for (const item of desktopItems) {
    if (item.parentId) continue
    if (groupIds.includes(item.id)) continue
    const or = iconRectFromItem(item)
    for (const gr of groupRects) {
      if (rectsOverlap(gr, or)) return true
    }
  }
  return false
}

