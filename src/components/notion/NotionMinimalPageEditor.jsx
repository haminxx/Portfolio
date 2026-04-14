import { useCallback, useEffect, useId, useRef, useState } from 'react'

const SLASH_OPTIONS = [
  { id: 'text', label: 'Text' },
  { id: 'h1', label: 'Heading 1' },
  { id: 'todo', label: 'To-Do List' },
  { id: 'code', label: 'Code Block' },
]

let blockSeq = 0
function nextId() {
  blockSeq += 1
  return `blk-${blockSeq}`
}

function stripSlashTrigger(text) {
  const i = text.lastIndexOf('/')
  if (i < 0) return text
  return (text.slice(0, i) + text.slice(i + 1)).replace(/\s+$/, '')
}

function focusEnd(el) {
  if (!el) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

export default function NotionMinimalPageEditor() {
  const menuId = useId()
  const [blocks, setBlocks] = useState(() => [{ id: nextId(), type: 'text', text: '' }])
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashIndex, setSlashIndex] = useState(0)
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 })
  const slashBlockRef = useRef(null)
  const editorRefs = useRef(new Map())
  const pendingDomTextRef = useRef(null)

  const setRef = useCallback((id, el) => {
    if (el) editorRefs.current.set(id, el)
    else editorRefs.current.delete(id)
  }, [])

  const measureSlashMenuPosition = useCallback((el) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      const r = el.getBoundingClientRect()
      setSlashPos({ top: r.bottom + 4, left: r.left })
      return
    }
    const range = sel.getRangeAt(0).cloneRange()
    range.collapse(true)
    const rects = range.getClientRects()
    const rect = rects.length ? rects[0] : range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      const r = el.getBoundingClientRect()
      setSlashPos({ top: r.bottom + 4, left: r.left })
      return
    }
    setSlashPos({ top: rect.bottom + 4, left: rect.left })
  }, [])

  const applySlashOption = useCallback((optionId) => {
    const bid = slashBlockRef.current
    if (!bid) return

    setBlocks((prev) => {
      const next = prev.map((b) => {
        if (b.id !== bid) return b
        const stripped = stripSlashTrigger(b.text)
        switch (optionId) {
          case 'h1':
            return { ...b, type: 'h1', text: stripped }
          case 'todo':
            return { ...b, type: 'todo', text: stripped ? `[ ] ${stripped}` : '[ ] ' }
          case 'code':
            return { ...b, type: 'code', text: stripped }
          default:
            return { ...b, type: 'text', text: stripped }
        }
      })
      const nb = next.find((x) => x.id === bid)
      pendingDomTextRef.current = { id: bid, text: nb?.text ?? '' }
      return next
    })

    setSlashOpen(false)

    requestAnimationFrame(() => {
      const p = pendingDomTextRef.current
      pendingDomTextRef.current = null
      if (!p) return
      const el = editorRefs.current.get(p.id)
      if (el) {
        el.textContent = p.text
        el.focus()
        focusEnd(el)
      }
    })
  }, [])

  const checkSlash = useCallback(
    (blockIdInner, el) => {
      const text = el.textContent ?? ''
      if (text.endsWith('/') && !text.endsWith('//')) {
        slashBlockRef.current = blockIdInner
        measureSlashMenuPosition(el)
        setSlashOpen(true)
        setSlashIndex(0)
      } else if (slashOpen && slashBlockRef.current === blockIdInner && !text.includes('/')) {
        setSlashOpen(false)
      }
    },
    [measureSlashMenuPosition, slashOpen],
  )

  useEffect(() => {
    if (!slashOpen) return
    const onDown = (e) => {
      const t = e.target
      if (t.closest?.(`[data-slash-menu="${menuId}"]`)) return
      setSlashOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [slashOpen, menuId])

  const onInput = (block, el) => {
    const text = el.textContent ?? ''
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, text } : b)))
    checkSlash(block.id, el)
  }

  const onKeyDownBlock = (e, index, block) => {
    if (slashOpen && slashBlockRef.current === block.id) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % SLASH_OPTIONS.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + SLASH_OPTIONS.length) % SLASH_OPTIONS.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        applySlashOption(SLASH_OPTIONS[slashIndex].id)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSlashOpen(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !slashOpen) {
      e.preventDefault()
      const newId = nextId()
      setBlocks((prev) => {
        const next = [...prev]
        next.splice(index + 1, 0, { id: newId, type: 'text', text: '' })
        return next
      })
      requestAnimationFrame(() => {
        const el = editorRefs.current.get(newId)
        el?.focus()
      })
    }

    if (e.key === 'Backspace') {
      const t = e.currentTarget.textContent ?? ''
      if (t === '' && blocks.length > 1) {
        e.preventDefault()
        const prevId = index > 0 ? blocks[index - 1].id : null
        setBlocks((prev) => prev.filter((b) => b.id !== block.id))
        if (prevId) {
          requestAnimationFrame(() => {
            const el = editorRefs.current.get(prevId)
            el?.focus()
            focusEnd(el)
          })
        }
      }
    }
  }

  const blockClass = (type) => {
    switch (type) {
      case 'h1':
        return 'text-3xl font-bold tracking-tight text-neutral-950 outline-none'
      case 'code':
        return 'rounded bg-neutral-100 px-2 py-2 font-mono text-sm text-neutral-900 outline-none'
      case 'todo':
        return 'text-base text-neutral-950 outline-none'
      default:
        return 'min-h-[1.5em] text-base leading-relaxed text-neutral-950 outline-none'
    }
  }

  return (
    <div className="relative min-h-[60vh] bg-white px-8 py-10 font-sans">
      <div className="mx-auto max-w-2xl space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            contentEditable
            suppressContentEditableWarning
            ref={(el) => setRef(block.id, el)}
            className={blockClass(block.type)}
            onInput={(e) => onInput(block, e.currentTarget)}
            onKeyDown={(e) => onKeyDownBlock(e, index, block)}
          />
        ))}
      </div>

      {slashOpen && (
        <div
          data-slash-menu={menuId}
          role="listbox"
          aria-label="Insert block"
          className="fixed z-50 min-w-[200px] rounded-lg border border-gray-200/50 bg-white/70 py-1 shadow-lg backdrop-blur-md"
          style={{ top: slashPos.top, left: slashPos.left }}
        >
          {SLASH_OPTIONS.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={i === slashIndex}
              className={`flex w-full px-3 py-2 text-left text-sm text-neutral-900 ${i === slashIndex ? 'bg-neutral-200/80' : 'hover:bg-neutral-100/90'}`}
              onMouseEnter={() => setSlashIndex(i)}
              onClick={() => applySlashOption(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
