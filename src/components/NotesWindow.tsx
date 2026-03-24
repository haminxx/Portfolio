import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'notes-app-documents'

type NoteDoc = {
  id: string
  title: string
  body: string
  updatedAt: number
}

function loadDocs(): NoteDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return [
        { id: '1', title: 'Welcome', body: 'Jot something down…', updatedAt: Date.now() },
      ]
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((n): n is NoteDoc => n && typeof n === 'object' && typeof (n as NoteDoc).id === 'string')
      .map((n) => ({
        id: n.id,
        title: typeof n.title === 'string' ? n.title : 'Note',
        body: typeof n.body === 'string' ? n.body : '',
        updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
      }))
  } catch {
    return [{ id: '1', title: 'Welcome', body: '', updatedAt: Date.now() }]
  }
}

function saveDocs(docs: NoteDoc[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch {
    /* ignore */
  }
}

export default function NotesWindow() {
  const [docs, setDocs] = useState<NoteDoc[]>(loadDocs)
  const [activeId, setActiveId] = useState(() => docs[0]?.id ?? '1')

  useEffect(() => {
    saveDocs(docs)
  }, [docs])

  const active = useMemo(() => docs.find((d) => d.id === activeId) ?? docs[0], [docs, activeId])

  const updateActive = useCallback(
    (patch: Partial<Pick<NoteDoc, 'title' | 'body'>>) => {
      if (!active) return
      setDocs((prev) =>
        prev.map((d) =>
          d.id === active.id
            ? { ...d, ...patch, title: patch.title ?? d.title, body: patch.body ?? d.body, updatedAt: Date.now() }
            : d,
        ),
      )
    },
    [active],
  )

  const addNote = useCallback(() => {
    const id = `n-${Date.now()}`
    const next: NoteDoc = { id, title: 'New note', body: '', updatedAt: Date.now() }
    setDocs((prev) => [next, ...prev])
    setActiveId(id)
  }, [])

  return (
    <div className="flex h-full min-h-[400px] w-full overflow-hidden rounded-b-[10px] bg-[#f5f5f0] text-[#1c1c1e]">
      <aside className="flex w-[180px] shrink-0 flex-col border-r border-black/10 bg-[#ecece8]">
        <div className="border-b border-black/10 px-3 py-2">
          <button
            type="button"
            onClick={addNote}
            className="w-full rounded-lg bg-[#ffd52b] px-2 py-1.5 text-sm font-semibold text-black shadow-sm hover:brightness-105"
          >
            New Note
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-1">
          {[...docs]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(d.id)}
                  className={`mb-0.5 w-full rounded-md px-2 py-2 text-left text-sm ${
                    d.id === activeId ? 'bg-white shadow-sm' : 'hover:bg-black/5'
                  }`}
                >
                  <span className="line-clamp-2 font-medium">{d.title || 'Untitled'}</span>
                </button>
              </li>
            ))}
        </ul>
      </aside>
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="h-[22px] shrink-0 rounded-tr-md bg-[#ffd52b] shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]" />
        <div className="flex h-3 shrink-0 items-center justify-center gap-1.5 bg-[#f5f5f0]">
          {Array.from({ length: 13 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-[#b0b0a8]" />
          ))}
        </div>
        <div
          className="flex flex-1 flex-col bg-[linear-gradient(#f5f5f0_0px,#f5f5f0_23px,#e8e8e2_24px)] bg-[length:100%_24px] px-4 py-3"
          style={{ backgroundImage: 'linear-gradient(#f5f5f0 0px, #f5f5f0 23px, #dcdcd4 24px)' }}
        >
          {active ? (
            <>
              <input
                type="text"
                value={active.title}
                onChange={(e) => updateActive({ title: e.target.value })}
                className="mb-2 border-none bg-transparent text-lg font-bold outline-none placeholder:text-black/30"
                placeholder="Title"
              />
              <textarea
                value={active.body}
                onChange={(e) => updateActive({ body: e.target.value })}
                className="min-h-0 flex-1 resize-none border-none bg-transparent leading-6 outline-none"
                placeholder="Start typing…"
                spellCheck
              />
            </>
          ) : (
            <p className="text-black/50">Select or create a note</p>
          )}
        </div>
      </main>
    </div>
  )
}
