'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = {
  name: string
  accentColor: string
  className?: string
}

/** Staggered stroke-style name reveal (timing echoes Apple hello paths). */
export function VisitorNameReveal({ name, accentColor, className }: Props) {
  const display = name.trim() || 'friend'
  const chars = Array.from(display)

  return (
    <div
      className={cn('visitor-name-reveal', className)}
      style={{ ['--visitor-name-accent' as string]: accentColor }}
      aria-label={display}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={`${i}-${ch}`}
          className="visitor-name-reveal__char"
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.08 + i * 0.07,
          }}
        >
          {ch === ' ' ? '\u00a0' : ch}
        </motion.span>
      ))}
    </div>
  )
}
