const PREFIX = 'desktop-photo-widget-'

/** @typedef {{ galleryIndex: number, cropPadding: number }} PhotoWidgetPersisted */

/**
 * @param {string} widgetId
 * @returns {PhotoWidgetPersisted | null}
 */
export function loadPhotoWidgetState(widgetId) {
  try {
    const raw = localStorage.getItem(PREFIX + widgetId)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (typeof o?.galleryIndex !== 'number') return null
    const cropPadding = typeof o.cropPadding === 'number' ? Math.max(0, Math.min(40, o.cropPadding)) : 0
    return { galleryIndex: o.galleryIndex, cropPadding }
  } catch {
    return null
  }
}

/**
 * @param {string} widgetId
 * @param {PhotoWidgetPersisted} state
 */
export function savePhotoWidgetState(widgetId, state) {
  try {
    localStorage.setItem(PREFIX + widgetId, JSON.stringify(state))
  } catch {
    // ignore
  }
}
