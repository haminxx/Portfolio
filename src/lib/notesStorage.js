export const NOTES_STORAGE_KEY = 'portfolio-notes-v1'
export const NOTES_CHANGED_EVENT = 'portfolio-notes-changed'

const MY_GOAL_SEED_FLAG = 'portfolio-my-goal-seeded-v1'
const MY_GOAL_NOTE_ID = 'note-my-goals-v1'

/** @typedef {{ id: string, text: string, done: boolean }} ChecklistItem */
/** @typedef {{ type: 'checklist', items: ChecklistItem[] }} ChecklistBlock */
/** @typedef {{ id: string, title: string, updatedAt: number, blocks: ChecklistBlock[] }} NoteDoc */

/**
 * @returns {{ notes: NoteDoc[], pinnedNoteId: string | null }}
 */
export function loadNotesStore() {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY)
    if (!raw) {
      return applyMyGoalSeedIfNeeded({ notes: [defaultNote()], pinnedNoteId: null })
    }
    const o = JSON.parse(raw)
    const notes = Array.isArray(o?.notes) ? o.notes.filter((n) => n?.id && Array.isArray(n?.blocks)) : []
    const pinnedNoteId = typeof o?.pinnedNoteId === 'string' ? o.pinnedNoteId : null
    if (notes.length === 0) {
      const n = defaultNote()
      return applyMyGoalSeedIfNeeded({ notes: [n], pinnedNoteId: null })
    }
    return applyMyGoalSeedIfNeeded({ notes, pinnedNoteId })
  } catch {
    const n = defaultNote()
    return applyMyGoalSeedIfNeeded({ notes: [n], pinnedNoteId: null })
  }
}

function defaultNote() {
  const id = `note-${Date.now()}`
  return {
    id,
    title: 'Quick note',
    updatedAt: Date.now(),
    blocks: [{ type: 'checklist', items: [{ id: `i-${Date.now()}`, text: '', done: false }] }],
  }
}

function buildMyGoalNote() {
  const t = Date.now()
  return {
    id: MY_GOAL_NOTE_ID,
    title: 'My Goal',
    updatedAt: t,
    blocks: [
      {
        type: 'checklist',
        items: [
          { id: 'mg-portfolio', text: 'Build a Portfolio', done: true },
          { id: 'mg-job', text: 'Get a Full-time Job', done: false },
          { id: 'mg-racing', text: 'Earn a Racing License', done: false },
          { id: 'mg-trip', text: 'Coast-to-Coast Motorcycle Camping Road Trip', done: false },
        ],
      },
    ],
  }
}

/** One-time seed: pinned checklist note "My Goal" with default items. */
function applyMyGoalSeedIfNeeded(store) {
  try {
    if (typeof localStorage === 'undefined') return store
    if (localStorage.getItem(MY_GOAL_SEED_FLAG)) return store
    if (store.notes.some((n) => n.id === MY_GOAL_NOTE_ID)) {
      localStorage.setItem(MY_GOAL_SEED_FLAG, '1')
      return store
    }
    const note = buildMyGoalNote()
    const next = { notes: [note, ...store.notes], pinnedNoteId: note.id }
    localStorage.setItem(MY_GOAL_SEED_FLAG, '1')
    saveNotesStore(next)
    return next
  } catch {
    return store
  }
}

export function persistNotesLocal(store) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT))
  } catch {
    // ignore
  }
}

/**
 * @param {{ notes: NoteDoc[], pinnedNoteId: string | null }} store
 */
export function saveNotesStore(store) {
  persistNotesLocal(store)
  import('./notesFirestoreSync')
    .then((m) => m.schedulePushNotesStore(store))
    .catch(() => {})
}

/**
 * @param {string | null} pinnedId
 * @param {NoteDoc[]} notes
 */
export function getPinnedChecklistItems(pinnedId, notes) {
  if (!pinnedId) return []
  const note = notes.find((n) => n.id === pinnedId)
  if (!note) return []
  const block = note.blocks.find((b) => b.type === 'checklist')
  return block?.items ?? []
}

/**
 * @param {{ notes: NoteDoc[], pinnedNoteId: string | null }} store
 * @param {string} itemId
 * @param {boolean} done
 */
export function setPinnedChecklistItemDone(store, itemId, done) {
  const pinnedId = store.pinnedNoteId
  if (!pinnedId) return
  const notes = store.notes.map((n) => {
    if (n.id !== pinnedId) return n
    return {
      ...n,
      updatedAt: Date.now(),
      blocks: n.blocks.map((b) => {
        if (b.type !== 'checklist') return b
        return {
          ...b,
          items: b.items.map((it) => (it.id === itemId ? { ...it, done } : it)),
        }
      }),
    }
  })
  saveNotesStore({ ...store, notes })
}
