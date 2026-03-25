const IDS_KEY = 'desktop-photo-widget-ids-v1'

export const DEFAULT_PHOTO_WIDGET_IDS = ['photoA', 'photoB', 'photoC']

export function loadPhotoWidgetIdList() {
  try {
    const raw = localStorage.getItem(IDS_KEY)
    if (!raw) return [...DEFAULT_PHOTO_WIDGET_IDS]
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr) || !arr.length) return [...DEFAULT_PHOTO_WIDGET_IDS]
    const filtered = arr.filter((x) => typeof x === 'string' && x.startsWith('photo'))
    return filtered.length ? filtered : [...DEFAULT_PHOTO_WIDGET_IDS]
  } catch {
    return [...DEFAULT_PHOTO_WIDGET_IDS]
  }
}

export function savePhotoWidgetIdList(ids) {
  try {
    localStorage.setItem(IDS_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

export function generatePhotoWidgetId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const ADD_PHOTO_WIDGET_EVENT = 'portfolio-add-photo-desktop-widget'
