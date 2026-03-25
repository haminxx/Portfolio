'use client'

import type React from 'react'
import { motion } from 'framer-motion'

const drawOutline = {
  hidden: { pathLength: 0, opacity: 0.65 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.55, ease: [0.43, 0.13, 0.23, 0.96] as const },
      opacity: { duration: 0.25 },
    },
  },
}

export interface SketchOutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button label */
  children: React.ReactNode
}

export function SketchOutlineButton({ children, className = '', type = 'button', ...rest }: SketchOutlineButtonProps) {
  return (
    <motion.button
      type={type}
      className={`sketch-outline-btn ${className}`.trim()}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      {...rest}
    >
      <svg className="sketch-outline-btn__border" viewBox="0 0 128 48" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M 16 4.5 L 112 4.5 C 118.5 4.5 123.5 9.5 123.5 16 L 123.5 32 C 123.5 38.5 118.5 43.5 112 43.5 L 16 43.5 C 9.5 43.5 4.5 38.5 4.5 32 L 4.5 16 C 4.5 9.5 9.5 4.5 16 4.5 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial="hidden"
          animate="visible"
          variants={drawOutline}
        />
      </svg>
      <span className="sketch-outline-btn__text">{children}</span>
    </motion.button>
  )
}
