/**
 * Shared widget grid geometry for DesktopWidgets and widgetOverlapGeometry.
 */

export const CELL = 40
export const GRID_MIN = 2
export const GRID_MAX = 16

export const STATIC_WIDGET_IDS = [
  'calendar',
  'clock',
  'weather',
  'music',
  'bgControls',
  'notesChecklist',
]

export const STATIC_SIZES = {
  calendar: { w: 200, h: 220 },
  clock: { w: 160, h: 112 },
  weather: { w: 400, h: 200 },
  music: { w: 312, h: 136 },
  bgControls: { w: 160, h: 160 },
  notesChecklist: { w: 200, h: 200 },
}

/** Widgets that always use default footprint (no corner resize). */
export const NON_RESIZABLE_WIDGET_IDS = ['calendar', 'bgControls']

export function clampGrid(n) {
  const v = Math.round(Number(n))
  if (Number.isNaN(v)) return GRID_MIN
  return Math.max(GRID_MIN, Math.min(GRID_MAX, v))
}

export function defaultStaticGrid(id) {
  const s = STATIC_SIZES[id] || { w: 200, h: 200 }
  return {
    gridW: clampGrid(Math.ceil(s.w / CELL)),
    gridH: clampGrid(Math.ceil(s.h / CELL)),
  }
}

export function defaultGridForWidget(id) {
  if (typeof id === 'string' && id.startsWith('photo')) {
    return { gridW: 6, gridH: 6 }
  }
  return defaultStaticGrid(id)
}

export function getBoxSizeForWidget(id, entry) {
  const def = defaultGridForWidget(id)
  if (NON_RESIZABLE_WIDGET_IDS.includes(id)) {
    return { w: def.gridW * CELL, h: def.gridH * CELL }
  }
  const gw = clampGrid(entry?.gridW ?? def.gridW)
  const gh = clampGrid(entry?.gridH ?? def.gridH)
  return { w: gw * CELL, h: gh * CELL }
}

export function getWidgetRectFromEntry(id, entry) {
  const { w, h } = getBoxSizeForWidget(id, entry || {})
  const x = entry?.x ?? 0
  const y = entry?.y ?? 0
  return { left: x, top: y, right: x + w, bottom: y + h }
}

export function collectWidgetIdsFromLayout(layout) {
  const ids = new Set(STATIC_WIDGET_IDS)
  if (layout && typeof layout === 'object') {
    for (const k of Object.keys(layout)) {
      if (k.startsWith('photo')) ids.add(k)
    }
  }
  return [...ids]
}
