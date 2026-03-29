'use client'

import type { ComponentProps } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

const initialProps = { pathLength: 0, opacity: 0 }
const animateProps = { pathLength: 1, opacity: 1 }

export type CursiveGlyph = {
  path: string
  width: number
  tailOffset: number
}

/**
 * Single-stroke cursive glyphs in local coords (baseline ~y=56). tailOffset = horizontal
 * advance to the next letter’s attachment point (sum of preceding tailOffsets = translate X).
 */
export const CursiveAlphabet: Record<string, CursiveGlyph> = {
  a: {
    path: 'M0 54C2 38 16 30 30 34C42 38 46 50 38 60C32 68 14 66 8 58C4 52 8 48 44 56',
    width: 48,
    tailOffset: 46,
  },
  b: {
    path: 'M0 72L0 28C0 18 10 14 18 22C26 32 24 48 12 54C4 58 0 62 0 68C0 74 10 76 22 70C36 62 46 52 52 48',
    width: 54,
    tailOffset: 52,
  },
  c: {
    path: 'M52 48C44 36 32 32 20 36C8 40 0 52 4 62C8 72 22 74 36 66',
    width: 40,
    tailOffset: 38,
  },
  d: {
    path: 'M48 72L48 28C48 18 36 14 26 22C14 32 12 50 22 58C32 66 44 60 48 52L48 22C48 12 52 8 56 14',
    width: 56,
    tailOffset: 54,
  },
  e: {
    path: 'M0 50C8 38 28 34 40 40C48 44 48 54 38 58C28 62 12 58 4 52M44 46L12 48',
    width: 46,
    tailOffset: 44,
  },
  f: {
    path: 'M36 8C28 10 22 18 22 28L22 62C22 70 14 74 6 70M8 40L32 36',
    width: 36,
    tailOffset: 34,
  },
  g: {
    path: 'M28 34C16 34 6 46 6 58C6 72 20 78 34 70C44 64 50 52 50 40L50 72C50 86 38 94 24 88',
    width: 52,
    tailOffset: 50,
  },
  h: {
    path: 'M0 20L0 68M0 48C8 38 22 34 32 40C40 46 42 58 42 68C42 72 46 74 52 70',
    width: 54,
    tailOffset: 52,
  },
  i: {
    path: 'M8 22L8 18C8 14 12 12 14 16M10 36L10 62C10 68 18 70 26 64',
    width: 30,
    tailOffset: 28,
  },
  j: {
    path: 'M12 18L12 14C12 10 16 8 18 12M14 34L14 70C14 82 6 88 -4 82',
    width: 28,
    tailOffset: 26,
  },
  k: {
    path: 'M0 20L0 72M0 52L38 34M18 48L46 68',
    width: 48,
    tailOffset: 46,
  },
  l: {
    path: 'M10 18C10 14 14 12 16 16M12 32L12 66C12 74 22 76 32 68',
    width: 36,
    tailOffset: 34,
  },
  m: {
    path: 'M0 40L0 62M0 48C6 40 18 38 26 44C32 50 34 58 34 66M34 48C40 40 52 38 60 44C66 50 68 58 68 66',
    width: 70,
    tailOffset: 68,
  },
  n: {
    path: 'M0 40L0 62M0 48C8 40 24 38 34 46C42 54 44 62 44 70',
    width: 46,
    tailOffset: 44,
  },
  o: {
    path: 'M26 34C12 34 2 46 2 58C2 70 14 76 28 72C42 68 50 54 46 42C42 32 32 30 26 34Z',
    width: 52,
    tailOffset: 50,
  },
  p: {
    path: 'M0 40L0 78M0 48C10 38 28 36 38 46C48 56 44 70 28 74C14 76 4 64 0 52',
    width: 48,
    tailOffset: 46,
  },
  q: {
    path: 'M48 48C38 38 20 36 10 46C0 56 4 72 20 74C34 76 44 64 48 52L48 80C48 90 52 94 58 88',
    width: 54,
    tailOffset: 52,
  },
  r: {
    path: 'M0 42L0 62M0 50C6 42 20 40 30 46C36 50 38 56 38 62',
    width: 40,
    tailOffset: 38,
  },
  s: {
    path: 'M36 38C28 32 12 34 8 42C4 50 12 54 24 56C36 58 42 62 38 70C34 78 18 80 6 72',
    width: 42,
    tailOffset: 40,
  },
  t: {
    path: 'M18 12L18 62C18 70 26 74 36 68M6 36L32 32',
    width: 38,
    tailOffset: 36,
  },
  u: {
    path: 'M6 40C6 54 10 64 22 66C34 68 44 58 46 44L46 62C46 70 54 72 62 66',
    width: 54,
    tailOffset: 52,
  },
  v: {
    path: 'M0 40L22 62L44 38',
    width: 46,
    tailOffset: 44,
  },
  w: {
    path: 'M0 40L14 62L28 44L42 62L56 40',
    width: 58,
    tailOffset: 56,
  },
  x: {
    path: 'M0 38L40 66M40 38L0 66',
    width: 42,
    tailOffset: 40,
  },
  y: {
    path: 'M4 40L22 62L40 36M22 62L12 82C8 90 -2 88 -6 78',
    width: 48,
    tailOffset: 46,
  },
  z: {
    path: 'M6 38L42 38L8 66L44 66',
    width: 48,
    tailOffset: 46,
  },
  '-': {
    path: 'M4 52L28 52',
    width: 32,
    tailOffset: 30,
  },
  "'": {
    path: 'M8 20C6 16 8 12 12 14',
    width: 16,
    tailOffset: 14,
  },
}

const SPACE_GAP = 26
const DIGIT_GAP = 20
const UNKNOWN_GAP = 16

/** Latin base + lowercase; spaces; hyphen; ASCII apostrophe / right single quote. */
function mapCharToKey(ch: string): 'space' | 'gap' | string {
  if (ch === ' ') return 'space'
  const decomposed = ch.normalize('NFD').replace(/\p{M}/gu, '')
  const lower = decomposed.toLowerCase()
  if (lower === '-' || ch === '-') return '-'
  if (lower === "'" || ch === '\u2019') return "'"
  if (/^[0-9]$/.test(lower)) return 'gap'
  if (lower.length === 1 && CursiveAlphabet[lower]) return lower
  if (/^[a-z]$/.test(lower)) return 'gap'
  return 'gap'
}

type DrawItem = {
  key: string
  glyph: CursiveGlyph
  x: number
  duration: number
  delay: number
}

type DynamicCursiveTextProps = ComponentProps<typeof motion.svg> & {
  text: string
  speed?: number
  onAnimationComplete?: () => void
}

/**
 * Kerning / connection: letter i is placed at x = sum(tailOffset[j]) for all segments j before i
 * (draw uses glyph.tailOffset; gaps use fixed advances). Same cumulative sum yields totalLineWidth.
 */
export function DynamicCursiveText({
  text,
  className,
  speed = 1,
  onAnimationComplete,
  ...props
}: DynamicCursiveTextProps) {
  const display = text.trim() || 'friend'
  const completeRef = useRef(false)

  const { drawItems, totalWidth, viewBoxWidth, vbHeight } = useMemo(() => {
    let x = 0
    const items: DrawItem[] = []

    // ASCII letters use CursiveAlphabet (case-insensitive); NFD strips Latin accents.
    // Spaces, hyphens, apostrophes: space or drawn punctuation; digits & other Unicode → fixed advance gap only.
    for (const ch of display) {
      const mapped = mapCharToKey(ch)
      if (mapped === 'space') {
        x += SPACE_GAP
        continue
      }
      if (mapped === 'gap') {
        x += /\d/.test(ch) ? DIGIT_GAP : UNKNOWN_GAP
        continue
      }
      const glyph = CursiveAlphabet[mapped]
      if (!glyph) {
        x += UNKNOWN_GAP
        continue
      }
      const duration =
        (0.32 + Math.min(glyph.tailOffset, 72) * 0.0025) * speed
      items.push({
        key: `${mapped}-${items.length}-${x}`,
        glyph,
        x,
        duration,
        delay: 0,
      })
      x += glyph.tailOffset
    }

    let t = 0
    for (let i = 0; i < items.length; i++) {
      items[i] = { ...items[i], delay: t }
      t += items[i].duration
    }

    const total = x
    const vbH = 96
    const minW = 320
    const pad = 80
    const vbW = Math.max(minW, total + pad)
    return {
      drawItems: items,
      totalWidth: total,
      viewBoxWidth: vbW,
      vbHeight: vbH,
    }
  }, [display, speed])

  useEffect(() => {
    completeRef.current = false
  }, [display])

  const offsetX = (viewBoxWidth - totalWidth) / 2
  const lastIndex = drawItems.length - 1

  useEffect(() => {
    if (drawItems.length > 0) return
    completeRef.current = false
    if (!onAnimationComplete) return
    const id = requestAnimationFrame(() => {
      if (!completeRef.current) {
        completeRef.current = true
        onAnimationComplete()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [drawItems.length, onAnimationComplete])

  const handlePathComplete = (index: number) => {
    if (index !== lastIndex) return
    if (completeRef.current) return
    completeRef.current = true
    onAnimationComplete?.()
  }

  return (
    <motion.svg
      className={cn('h-32 w-full max-w-3xl overflow-visible md:h-48', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${viewBoxWidth} ${vbHeight}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 1 }}
      {...props}
    >
      <title>{display}</title>
      <g transform={`translate(${offsetX} 8)`}>
        {drawItems.map((item, index) => (
          <motion.path
            key={item.key}
            d={item.glyph.path}
            transform={`translate(${item.x} 0)`}
            initial={initialProps}
            animate={animateProps}
            transition={{
              pathLength: { duration: item.duration, ease: 'easeInOut', delay: item.delay },
              opacity: {
                duration: Math.min(0.28, item.duration * 0.45),
                delay: item.delay,
              },
            }}
            onAnimationComplete={() => handlePathComplete(index)}
          />
        ))}
      </g>
    </motion.svg>
  )
}
