/**
 * Shared geometry for desktop widgets vs icons (overlap checks).
 * Must stay in sync with DesktopWidgets.jsx layout model.
 */
import {
  DESKTOP_ICON_WIDTH,
  DESKTOP_ICON_HEIGHT,
  DESKTOP_SAFE_TOP,
} from '../desktopConstants'
import {
  STATIC_WIDGET_IDS,
  clampGrid,
  defaultStaticGrid,
  defaultGridForWidget,
  collectWidgetIdsFromLayout,
  SQUARE_WIDGET_IDS,
  snapSquareLayoutEntry,
  referenceLayoutDefaults,
  REF_WIDGET_PADDING,
  REF_INNER_H,
  REF_INNER_W,
  getWidgetRectInWrapPixels,
  WIDGET_LAYOUT_STORAGE_KEY,
  layoutScaleFromInnerSize,
} from './widgetLayoutShared'

const LAYOUT_KEY = WIDGET_LAYOUT_STORAGE_KEY

const DEFAULT_LAYOUT = referenceLayoutDefaults()

/** Fallback scale when DOM is unavailable (e.g. SSR). */
export function inferLayoutMetricsFromWindow() {
  if (typeof window === 'undefined') {
    return {
      sx: 1,
      sy: 1,
      pl: REF_WIDGET_PADDING.left,
      pt: REF_WIDGET_PADDING.top,
      cw: REF_INNER_W,
      ch: REF_INNER_H,
    }
  }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const pl = REF_WIDGET_PADDING.left
  const pr = REF_WIDGET_PADDING.right
  const pt = REF_WIDGET_PADDING.top
  const pb = REF_WIDGET_PADDING.bottom
  const cw = Math.max(320, vw - pl - pr)
  const ch = Math.max(240, vh - pt - pb)
  const { sx, sy } = layoutScaleFromInnerSize(cw, ch)
  return { sx, sy, pl, pt, cw, ch }
}

function mergeLayoutFromStorage(parsed) {
  const out = { ...DEFAULT_LAYOUT }
  if (!parsed || typeof parsed !== 'object') return out

  const version = parsed._v
  const isRefSpace = version === 14
  const entries = { ...parsed }
  delete entries._v

  const idSet = new Set(STATIC_WIDGET_IDS)
  for (const k of Object.keys(entries)) {
    if (k.startsWith('photo')) idSet.add(k)
  }

  for (const id of idSet) {
    const p = entries[id]
    if (!p || typeof p !== 'object') continue
    const defG = defaultGridForWidget(id)
    const base = out[id] || {
      x: 80,
      y: 300,
      ...defG,
    }
    const next = {
      ...base,
      gridW: clampGrid(p.gridW != null ? p.gridW : base.gridW ?? defG.gridW),
      gridH: clampGrid(p.gridH != null ? p.gridH : base.gridH ?? defG.gridH),
    }
    if (isRefSpace && p.x != null && p.y != null) {
      next.x = p.x
      next.y = p.y
    }
    out[id] = next
  }

  for (const id of STATIC_WIDGET_IDS) {
    const def = defaultStaticGrid(id)
    if (!out[id]) out[id] = { ...DEFAULT_LAYOUT[id] }
    out[id].gridW = clampGrid(out[id].gridW ?? def.gridW)
    out[id].gridH = clampGrid(out[id].gridH ?? def.gridH)
  }

  for (const sid of SQUARE_WIDGET_IDS) {
    if (out[sid]) out[sid] = snapSquareLayoutEntry(sid, out[sid])
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

/**
 * Widget rects in **wrap / desktop pixel space** (same as icon positions).
 * Pass metrics from DesktopWidgets ResizeObserver, or omit to infer from window.
 */
export function getWidgetRectsFromLayout(layout, metrics) {
  if (!layout) return []
  const m = metrics ?? inferLayoutMetricsFromWindow()
  const { sx, sy, pl, pt } = m
  const ids = collectWidgetIdsFromLayout(layout)
  return ids.map((id) => {
    const entry = layout[id] || DEFAULT_LAYOUT[id]
    const r = getWidgetRectInWrapPixels(id, entry, sx, sy, pl, pt)
    return r
  })
}

export function rectsOverlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
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
export function nudgeIconGroupAfterDrop(candidates, groupIds, desktopItems, layoutMap, wrapWidth, wrapHeight, layoutMetrics) {
  if (!candidates || !groupIds?.length) return candidates
  const widgetRects = getWidgetRectsFromLayout(layoutMap, layoutMetrics)
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
