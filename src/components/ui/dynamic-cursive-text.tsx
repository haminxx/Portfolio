'use client'

import type { ComponentProps } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { CursiveAlphabet, type CursiveGlyph } from './cursive-alphabet-data'

const initialProps = { pathLength: 0, opacity: 1 }
const animateProps = { pathLength: 1, opacity: 1 }
const STROKE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const SPACE_GAP = 26
const DIGIT_GAP = 20
const UNKNOWN_GAP = 16

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

type GlyphSeg = {
  kind: 'glyph'
  key: string
  glyph: CursiveGlyph
  x: number
  duration: number
  delay: number
}

type ConnSeg = {
  kind: 'conn'
  key: string
  d: string
  duration: number
  delay: number
}

type Seg = GlyphSeg | ConnSeg

type DynamicCursiveTextProps = ComponentProps<typeof motion.svg> & {
  text: string
  speed?: number
  onAnimationComplete?: () => void
}

function buildSegments(display: string, speed: number): { segments: Seg[]; totalWidth: number; viewBoxWidth: number; vbHeight: number } {
  type GItem = { key: string; glyph: CursiveGlyph; x: number; baseDur: number }
  let x = 0
  const glyphItems: GItem[] = []

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
    const baseDur = (0.28 + Math.min(glyph.tailOffset, 72) * 0.0022) * speed
    glyphItems.push({
      key: `${mapped}-${glyphItems.length}-${x}`,
      glyph,
      x,
      baseDur,
    })
    x += glyph.tailOffset
  }

  const segments: Seg[] = []
  let t = 0
  for (let i = 0; i < glyphItems.length; i++) {
    const it = glyphItems[i]
    segments.push({
      kind: 'glyph',
      key: it.key,
      glyph: it.glyph,
      x: it.x,
      duration: it.baseDur,
      delay: t,
    })
    t += it.baseDur

    if (i < glyphItems.length - 1) {
      const next = glyphItems[i + 1]
      const x0 = it.x + it.glyph.tailOffset * 0.82
      const x1 = next.x + Math.min(10, next.glyph.tailOffset * 0.12)
      const y = 56
      const midX = (x0 + x1) / 2
      const d = `M ${x0} ${y} Q ${midX} ${y - 4} ${x1} ${y}`
      const cdur = 0.1 * speed
      segments.push({
        kind: 'conn',
        key: `conn-${i}`,
        d,
        duration: cdur,
        delay: t,
      })
      t += cdur
    }
  }

  const total = x
  const vbH = 108
  const minW = 320
  const pad = 96
  const vbW = Math.max(minW, total + pad)
  return { segments, totalWidth: total, viewBoxWidth: vbW, vbHeight: vbH }
}

/**
 * Italic skew + glyph paths with light connector curves; one continuous stroke feel.
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

  const { segments, totalWidth, viewBoxWidth, vbHeight } = useMemo(
    () => buildSegments(display, speed),
    [display, speed],
  )

  useEffect(() => {
    completeRef.current = false
  }, [display])

  const offsetX = (viewBoxWidth - totalWidth) / 2
  const lastIndex = segments.length - 1

  useEffect(() => {
    if (segments.length > 0) return
    completeRef.current = false
    if (!onAnimationComplete) return
    const id = requestAnimationFrame(() => {
      if (!completeRef.current) {
        completeRef.current = true
        onAnimationComplete()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [segments.length, onAnimationComplete])

  const handleSegmentComplete = (index: number) => {
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
      strokeWidth={2.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 1 }}
      {...props}
    >
      <title>{display}</title>
      <g transform={`translate(${offsetX} 14) skewX(-7)`}>
        {segments.map((seg, index) =>
          seg.kind === 'glyph' ? (
            <motion.path
              key={seg.key}
              d={seg.glyph.path}
              transform={`translate(${seg.x} 0)`}
              initial={initialProps}
              animate={animateProps}
              transition={{
                pathLength: { duration: seg.duration, ease: STROKE_EASE, delay: seg.delay },
              }}
              onAnimationComplete={() => handleSegmentComplete(index)}
            />
          ) : (
            <motion.path
              key={seg.key}
              d={seg.d}
              initial={initialProps}
              animate={animateProps}
              transition={{
                pathLength: { duration: seg.duration, ease: STROKE_EASE, delay: seg.delay },
              }}
              onAnimationComplete={() => handleSegmentComplete(index)}
            />
          ),
        )}
      </g>
    </motion.svg>
  )
}

export { CursiveAlphabet, type CursiveGlyph } from './cursive-alphabet-data'
