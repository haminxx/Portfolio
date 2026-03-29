'use client'

import type { ComponentProps } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

type Props = ComponentProps<typeof motion.svg> & {
  name: string
  speed?: number
  onAnimationComplete?: () => void
}

export function AppleNameEffect({
  name,
  className,
  speed = 1,
  onAnimationComplete,
  ...props
}: Props) {
  const duration = 2 * speed
  const display = name.trim() || 'friend'

  return (
    <motion.svg
      className={cn('h-32 w-full max-w-3xl overflow-visible md:h-48', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 200"
      initial={{ opacity: 1 }}
      {...props}
    >
      <title>{display}</title>
      <motion.text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-5xl font-semibold tracking-tighter md:text-8xl"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration, ease: 'easeInOut' },
          opacity: { duration: 0.45 },
        }}
        onAnimationComplete={onAnimationComplete}
      >
        {display}
      </motion.text>
    </motion.svg>
  )
}
