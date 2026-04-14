/**
 * Shared widget grid geometry for DesktopWidgets and widgetOverlapGeometry.
 *
 * Layout coordinates (x, y) and CELL-based sizes are stored in **reference space**:
 * inner content area of the widget tray matching a 1440×900 window with the same padding
 * as `.desktop-widgets` (48px top, 20px sides, 72px bottom).
 */

export const CELL = 40
export const GRID_MIN = 2
export const GRID_MAX = 16

/** Design-time window (matches original owner capture). */
export const REF_WINDOW_W = 1440
export const REF_WINDOW_H = 900

/** Padding on `.desktop-widgets` — keep in sync with DesktopWidgets.css */
export const REF_WIDGET_PADDING = { top: 48, right: 20, bottom: 72, left: 20 }

/** Inner content size at the reference window (where x/y live). */
export const REF_INNER_W = REF_WINDOW_W - REF_WIDGET_PADDING.left - REF_WIDGET_PADDING.right
export const REF_INNER_H = REF_WINDOW_H - REF_WIDGET_PADDING.top - REF_WIDGET_PADDING.bottom

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

/** Default pixel footprints in **reference** space (CELL grid). */
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

/**
 * Default widget positions in **reference inner** coordinates (see screenshot / owner layout).
 * Sizes are gridW × gridH in CELL units.
 */
const OWNER_LAYOUT_TEMPLATE = {
  bgControls: { x: 924, y: 432, gridW: 3, gridH: 3 },
  calendar: { x: 284, y: 41, gridW: 3, gridH: 3 },
  knotWidget: { x: 292, y: 163, gridW: 3, gridH: 3 },
  music: { x: 1056, y: 412, gridW: 9, gridH: 3 },
  notesChecklist: { x: 282, y: 288, gridW: 5, gridH: 4 },
  photoA: { x: 2, y: 38, gridW: 7, gridH: 10 },
  photoB: { x: 788, y: 40, gridW: 6, gridH: 8 },
  photoC: { x: 1040, y: 40, gridW: 10, gridH: 8 },
  weather: { x: 762, y: 418, gridW: 4, gridH: 4 },
  yearProgress: { x: 0, y: 490, gridW: 7, gridH: 3 },
}

/** Bump when default geometry or storage format changes. */
export const WIDGET_LAYOUT_STORAGE_KEY = 'desktop-widget-layout-v14'
export const WIDGET_LAYOUT_STORAGE_KEY_PREV = 'desktop-widget-layout-v13'

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

/** Width/height in **reference** pixels (before viewport scale). */
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

/** Axis-aligned rect in **reference** space. */
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

/**
 * Default layout: owner template in reference inner coordinates (not scaled by window).
 */
export function referenceLayoutDefaults() {
  /** @type {Record<string, { x: number, y: number, gridW: number, gridH: number }>} */
  const out = {}
  for (const [id, e] of Object.entries(OWNER_LAYOUT_TEMPLATE)) {
    out[id] = { x: e.x, y: e.y, gridW: e.gridW, gridH: e.gridH }
  }
  return out
}

/**
 * @deprecated Use referenceLayoutDefaults(); kept for call sites that passed viewport (ignored).
 */
export function defaultLayoutSnapshot(_viewportW, _viewportH) {
  return referenceLayoutDefaults()
}

/**
 * Scale factors from measured inner content size → reference inner size.
 */
export function layoutScaleFromInnerSize(innerW, innerH) {
  const w = Math.max(320, Number(innerW) || REF_INNER_W)
  const h = Math.max(240, Number(innerH) || REF_INNER_H)
  return { sx: w / REF_INNER_W, sy: h / REF_INNER_H }
}

/**
 * Widget axis rect in **desktop / icons-wrap pixel space** (same origin as icon x,y).
 */
export function getWidgetRectInWrapPixels(id, entry, sx, sy, padLeft, padTop) {
  const { w, h } = getBoxSizeForWidget(id, entry || {})
  const x = entry?.x ?? 0
  const y = entry?.y ?? 0
  const left = padLeft + x * sx
  const top = padTop + y * sy
  return {
    left,
    top,
    right: left + w * sx,
    bottom: top + h * sy,
  }
}
