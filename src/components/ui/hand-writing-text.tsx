'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'

const drawEllipse = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2.5, ease: [0.43, 0.13, 0.23, 0.96] as const },
      opacity: { duration: 0.5 },
    },
  },
}

const drawLine = {
  hidden: { pathLength: 0, opacity: 0.5 },
  visible: {
    pathLength: 1,
    opacity: 0.85,
    transition: {
      pathLength: {
        duration: 1.4,
        ease: [0.43, 0.13, 0.23, 0.96] as const,
        delay: 0.35,
      },
      opacity: { duration: 0.4, delay: 0.35 },
    },
  },
}

export interface HandWrittenAboutHeroProps {
  title?: string
  revealName: string
  /** Fires once when the main ellipse sketch stroke completes. */
  onEllipseDrawComplete?: () => void
}

export function HandWrittenAboutHero({
  title = 'My name is',
  revealName,
  onEllipseDrawComplete,
}: HandWrittenAboutHeroProps) {
  const ellipseCompleteRef = useRef(false)
  return (
    <div className="relative mx-auto w-full max-w-4xl py-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          initial="hidden"
          animate="visible"
          className="h-full w-full"
          aria-hidden
        >
          <motion.path
            d="M950 90 C1250 300 1050 480 600 520 C250 520 150 480 150 300 C150 120 350 80 600 80 C850 80 950 180 950 180"
            fill="none"
            strokeWidth="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={drawEllipse}
            className="text-neutral-900"
            onAnimationComplete={(def) => {
              if (def !== 'visible') return
              if (ellipseCompleteRef.current) return
              ellipseCompleteRef.current = true
              onEllipseDrawComplete?.()
            }}
          />
          <motion.path
            d="M 380 392 L 820 392"
            fill="none"
            strokeWidth="6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeDasharray="4 10"
            variants={drawLine}
            className="text-neutral-900"
          />
        </motion.svg>
      </div>

      <div className="relative z-10 flex min-h-[280px] flex-col items-center justify-center text-center text-neutral-900">
        <motion.h1
          className="about-sketch__title px-4 text-4xl font-extrabold tracking-tight text-neutral-900 md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.75 }}
        >
          {title}
        </motion.h1>

        <div className="relative mt-10 flex min-h-[3.5rem] w-full max-w-lg items-center justify-center px-8">
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-neutral-900 md:text-2xl"
            initial={false}
            animate={{
              opacity: revealName ? 1 : 0,
              y: revealName ? 0 : 6,
            }}
            transition={{ duration: 0.25 }}
          >
            {revealName || '\u00a0'}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
