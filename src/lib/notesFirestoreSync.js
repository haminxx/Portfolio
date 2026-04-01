/**
 * Real-time Firestore sync for the notes store (single doc, last-writer-wins).
 *
 * Security: demo rules may allow public read/write — anyone can overwrite notes.
 * Do not use for sensitive data; tighten rules + Firebase Auth for production.
 */
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from './firebase'
import {
  NOTES_STORAGE_KEY,
  NOTES_CHANGED_EVENT,
  loadNotesStore,
} from './notesStorage'

const COLLECTION = 'notes'
const DOC_ID = 'shared'
const DEBOUNCE_MS = 600

let debounceTimer = null
/** @type {string | null} */
let lastAppliedSerialized = null
let subscriptionRefCount = 0
/** @type {null | (() => void)} */
let unsubscribeSnapshot = null

function serializeStore(store) {
  return JSON.stringify({
    notes: store.notes,
    pinnedNoteId: store.pinnedNoteId ?? null,
  })
}

function parseDoc(data) {
  if (!data || typeof data !== 'object') return null
  const notes = Array.isArray(data.notes) ? data.notes : null
  if (!notes) return null
  const pinnedNoteId =
    typeof data.pinnedNoteId === 'string' || data.pinnedNoteId === null ? data.pinnedNoteId : null
  return { notes, pinnedNoteId }
}

function persistFromRemote(store) {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, serializeStore(store))
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTES_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

function handleSnapshot(snap) {
  const db = getFirebaseDb()
  if (!db) return
  const ref = doc(db, COLLECTION, DOC_ID)

  if (!snap.exists()) {
    const local = loadNotesStore()
    setDoc(
      ref,
      {
        notes: local.notes,
        pinnedNoteId: local.pinnedNoteId ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch(() => {})
    return
  }

  const store = parseDoc(snap.data())
  if (!store) return
  const serialized = serializeStore(store)
  if (serialized === lastAppliedSerialized) return
  lastAppliedSerialized = serialized
  persistFromRemote(store)
}

function attachSnapshotIfNeeded() {
  const db = getFirebaseDb()
  if (!db || unsubscribeSnapshot) return

  const ref = doc(db, COLLECTION, DOC_ID)
  unsubscribeSnapshot = onSnapshot(ref, handleSnapshot, () => {
    /* ignore; offline or rules */
  })
}

function detachSnapshotIfNeeded() {
  if (subscriptionRefCount > 0) return
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot()
    unsubscribeSnapshot = null
  }
}

/**
 * Subscribe to remote notes (shared singleton). Updates localStorage + dispatches NOTES_CHANGED_EVENT.
 * @returns {() => void} Unsubscribe
 */
export function subscribeNotesStore() {
  const db = getFirebaseDb()
  if (!db) return () => {}

  subscriptionRefCount += 1
  attachSnapshotIfNeeded()

  return () => {
    subscriptionRefCount = Math.max(0, subscriptionRefCount - 1)
    detachSnapshotIfNeeded()
  }
}

/**
 * Debounced push after local edits (called from saveNotesStore).
 * @param {{ notes: unknown[], pinnedNoteId: string | null }} store
 */
export function schedulePushNotesStore(store) {
  const db = getFirebaseDb()
  if (!db) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null
    const ref = doc(db, COLLECTION, DOC_ID)
    const serialized = serializeStore(store)
    setDoc(
      ref,
      {
        notes: store.notes,
        pinnedNoteId: store.pinnedNoteId ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
      .then(() => {
        lastAppliedSerialized = serialized
      })
      .catch(() => {})
  }, DEBOUNCE_MS)
}
