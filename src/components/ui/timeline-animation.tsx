'use client'

import { motion, useInView, type Variants } from 'framer-motion'
import type { RefObject } from 'react'

type MotionTag = 'div' | 'span' | 'a' | 'figure' | 'button'

const motionComponents: Record<MotionTag, typeof motion.div> = {
  div: motion.div,
  span: motion.span,
  a: motion.a,
  figure: motion.figure,
  button: motion.button,
}

export type TimelineContentProps = {
  as?: MotionTag
  animationNum: number
  timelineRef: RefObject<HTMLElement | null>
  customVariants: Variants
  className?: string
  children?: React.ReactNode
} & Record<string, unknown>

export function TimelineContent({
  as = 'div',
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...rest
}: TimelineContentProps) {
  const isInView = useInView(timelineRef, { once: true, amount: 0.12 })
  const Motion = motionComponents[as] ?? motion.div

  return (
    <Motion
      custom={animationNum}
      variants={customVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
      {...rest}
    >
      {children}
    </Motion>
  )
}
