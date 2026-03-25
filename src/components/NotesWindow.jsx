import { useState, useCallback, useMemo } from 'react'
import { Pin, Plus, Trash2 } from 'lucide-react'
import { loadNotesStore, saveNotesStore } from '../lib/notesStorage'
import './NotesWindow.css'

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultNewNote() {
  return {
    id: newId('note'),
    title: 'New note',
    updatedAt: Date.now(),
    blocks: [{ type: 'checklist', items: [{ id: newId('item'), text: '', done: false }] }],
  }
}

export default function NotesWindow() {
  const [store, setStore] = useState(() => loadNotesStore())
  const [activeId, setActiveId] = useState(() => {
    const s = loadNotesStore()
    return s.notes[0]?.id ?? null
  })

  const persist = useCallback((next) => {
    saveNotesStore(next)
    setStore(next)
  }, [])

  const activeNote = useMemo(() => store.notes.find((n) => n.id === activeId), [store.notes, activeId])

  const checklist = useMemo(() => {
    if (!activeNote) return { items: [] }
    const b = activeNote.blocks.find((x) => x.type === 'checklist')
    return b ?? { items: [] }
  }, [activeNote])

  const setTitle = (title) => {
    if (!activeId) return
    const notes = store.notes.map((n) => (n.id === activeId ? { ...n, title, updatedAt: Date.now() } : n))
    persist({ ...store, notes })
  }

  const setItemText = (itemId, text) => {
    if (!activeId) return
    const notes = store.notes.map((n) => {
      if (n.id !== activeId) return n
      return {
        ...n,
        updatedAt: Date.now(),
        blocks: n.blocks.map((b) => {
          if (b.type !== 'checklist') return b
          return { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
        }),
      }
    })
    persist({ ...store, notes })
  }

  const toggleItem = (itemId, done) => {
    if (!activeId) return
    const notes = store.notes.map((n) => {
      if (n.id !== activeId) return n
      return {
        ...n,
        updatedAt: Date.now(),
        blocks: n.blocks.map((b) => {
          if (b.type !== 'checklist') return b
          return { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, done } : it)) }
        }),
      }
    })
    persist({ ...store, notes })
  }

  const addChecklistItem = () => {
    if (!activeId) return
    const item = { id: newId('item'), text: '', done: false }
    const notes = store.notes.map((n) => {
      if (n.id !== activeId) return n
      return {
        ...n,
        updatedAt: Date.now(),
        blocks: n.blocks.map((b) => {
          if (b.type !== 'checklist') return b
          return { ...b, items: [...b.items, item] }
        }),
      }
    })
    persist({ ...store, notes })
  }

  const newNote = () => {
    const n = defaultNewNote()
    persist({ ...store, notes: [n, ...store.notes] })
    setActiveId(n.id)
  }

  const deleteActive = () => {
    if (!activeId) return
    const notes = store.notes.filter((n) => n.id !== activeId)
    const nextPinned = store.pinnedNoteId === activeId ? null : store.pinnedNoteId
    const next = { ...store, notes: notes.length ? notes : [defaultNewNote()], pinnedNoteId: nextPinned }
    if (!notes.length) {
      setActiveId(next.notes[0].id)
    } else {
      setActiveId(notes[0].id)
    }
    persist(next)
  }

  const togglePin = () => {
    if (!activeId) return
    const pinned = store.pinnedNoteId === activeId ? null : activeId
    persist({ ...store, pinnedNoteId: pinned })
  }

  const sortedNotes = useMemo(
    () => [...store.notes].sort((a, b) => b.updatedAt - a.updatedAt),
    [store.notes],
  )

  return (
    <div className="notes-window">
      <aside className="notes-window__sidebar">
        <div className="notes-window__sidebar-head">
          <button type="button" className="notes-window__new" onClick={newNote}>
            <Plus size={18} strokeWidth={2} />
            <span>New Note</span>
          </button>
        </div>
        <ul className="notes-window__list">
          {sortedNotes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`notes-window__row ${n.id === activeId ? 'notes-window__row--active' : ''} ${store.pinnedNoteId === n.id ? 'notes-window__row--pinned' : ''}`}
                onClick={() => setActiveId(n.id)}
              >
                <span className="notes-window__row-title">{n.title?.trim() || 'Untitled'}</span>
                <span className="notes-window__row-date">
                  {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="notes-window__editor">
        {activeNote ? (
          <>
            <div className="notes-window__toolbar">
              <button
                type="button"
                className={`notes-window__pin ${store.pinnedNoteId === activeId ? 'notes-window__pin--on' : ''}`}
                onClick={togglePin}
                title={store.pinnedNoteId === activeId ? 'Unpin from desktop widget' : 'Pin to desktop widget'}
              >
                <Pin size={18} strokeWidth={2} fill={store.pinnedNoteId === activeId ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="notes-window__trash" onClick={deleteActive} title="Delete note">
                <Trash2 size={18} strokeWidth={2} />
              </button>
            </div>
            <input
              className="notes-window__title-input"
              value={activeNote.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              aria-label="Note title"
            />
            <div className="notes-window__check-section">
              <div className="notes-window__check-head">
                <span>Checklist</span>
                <button type="button" className="notes-window__add-item" onClick={addChecklistItem}>
                  Add item
                </button>
              </div>
              <ul className="notes-window__checklist">
                {checklist.items.map((it) => (
                  <li key={it.id} className="notes-window__check-row">
                    <input
                      type="checkbox"
                      checked={!!it.done}
                      onChange={(e) => toggleItem(it.id, e.target.checked)}
                      className="notes-window__checkbox"
                    />
                    <input
                      type="text"
                      className="notes-window__item-input"
                      value={it.text}
                      onChange={(e) => setItemText(it.id, e.target.value)}
                      placeholder="List item"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="notes-window__empty">Select or create a note.</p>
        )}
      </main>
    </div>
  )
}
