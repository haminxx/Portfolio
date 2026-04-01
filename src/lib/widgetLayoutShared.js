/**
 * Shared widget grid geometry for DesktopWidgets and widgetOverlapGeometry.
 */

export const CELL = 40
export const GRID_MIN = 2
export const GRID_MAX = 16

export const STATIC_WIDGET_IDS = [
  'calendar',
  'weather',
  'music',
  'bgControls',
  'notesChecklist',
  'knotWidget',
  'yearProgress',
]

/** Widgets whose layout gridW/gridH are forced equal (square footprint). */
export const SQUARE_WIDGET_IDS = ['weather', 'calendar']

/** Default pixel footprints (snapped to CELL grid). Tight ~120px squares where possible. */
export const STATIC_SIZES = {
  calendar: { w: 120, h: 120 },
  weather: { w: 120, h: 120 },
  music: { w: 240, h: 120 },
  bgControls: { w: 120, h: 120 },
  notesChecklist: { w: 160, h: 160 },
  knotWidget: { w: 120, h: 120 },
  yearProgress: { w: 200, h: 120 },
}

/** Widgets that always use default footprint (no corner resize). */
export const NON_RESIZABLE_WIDGET_IDS = ['bgControls']

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
    return { gridW: 3, gridH: 3 }
  }
  return defaultStaticGrid(id)
}

function squareSide(entry, def) {
  return clampGrid(Math.min(clampGrid(entry?.gridW ?? def.gridW), clampGrid(entry?.gridH ?? def.gridH)))
}

export function snapSquareLayoutEntry(id, entry) {
  if (!SQUARE_WIDGET_IDS.includes(id)) return entry
  const def = defaultGridForWidget(id)
  const s = squareSide(entry, def)
  return { ...entry, gridW: s, gridH: s }
}

export function snapWeatherLayoutEntry(entry) {
  return snapSquareLayoutEntry('weather', entry)
}

export function getBoxSizeForWidget(id, entry) {
  const def = defaultGridForWidget(id)
  if (NON_RESIZABLE_WIDGET_IDS.includes(id)) {
    return { w: def.gridW * CELL, h: def.gridH * CELL }
  }
  if (SQUARE_WIDGET_IDS.includes(id)) {
    const s = squareSide(entry, def)
    return { w: s * CELL, h: s * CELL }
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

/** Reference viewport used when scaling owner default x/y (must match capture). */
const REF_LAYOUT_W = 1440
const REF_LAYOUT_H = 900

/**
 * Owner-tuned defaults at REF_LAYOUT_W × REF_LAYOUT_H; positions scale with viewport, grid sizes stay fixed.
 */
const OWNER_LAYOUT_TEMPLATE = {
  bgControls: { x: 924, y: 379, gridW: 3, gridH: 3 },
  calendar: { x: 284, y: 41, gridW: 3, gridH: 3 },
  knotWidget: { x: 292, y: 163, gridW: 3, gridH: 3 },
  music: { x: 1056, y: 360, gridW: 9, gridH: 3 },
  notesChecklist: { x: 282, y: 288, gridW: 5, gridH: 4 },
  photoA: { x: 2, y: 38, gridW: 7, gridH: 10 },
  photoB: { x: 788, y: 40, gridW: 6, gridH: 8 },
  photoC: { x: 1040, y: 40, gridW: 10, gridH: 8 },
  weather: { x: 762, y: 366, gridW: 4, gridH: 4 },
  yearProgress: { x: 0, y: 438, gridW: 7, gridH: 3 },
}

/** Bump when default geometry changes (keep DesktopWidgets + widgetOverlapGeometry in sync). */
export const WIDGET_LAYOUT_STORAGE_KEY = 'desktop-widget-layout-v12'
export const WIDGET_LAYOUT_STORAGE_KEY_PREV = 'desktop-widget-layout-v11'

function scaleOwnerLayout(viewportW, viewportH) {
  const w = Math.max(640, Math.min(Number(viewportW) || REF_LAYOUT_W, 4096))
  const h = Math.max(480, Math.min(Number(viewportH) || REF_LAYOUT_H, 4096))
  const sx = w / REF_LAYOUT_W
  const sy = h / REF_LAYOUT_H
  /** @type {Record<string, { x: number, y: number, gridW: number, gridH: number }>} */
  const out = {}
  for (const [id, e] of Object.entries(OWNER_LAYOUT_TEMPLATE)) {
    out[id] = {
      x: Math.round(e.x * sx),
      y: Math.round(e.y * sy),
      gridW: e.gridW,
      gridH: e.gridH,
    }
  }
  return out
}

/**
 * Default widget positions/sizes: owner layout scaled from 1440×900; grid cell sizes unchanged.
 */
export function defaultLayoutSnapshot(viewportW, viewportH) {
  return scaleOwnerLayout(viewportW, viewportH)
}
