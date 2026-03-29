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
