import { motion } from 'framer-motion'

type Props = {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  'aria-label'?: string
}

export default function BackgroundMotionSlider({
  min,
  max,
  step,
  value,
  onChange,
  'aria-label': ariaLabel = 'Motion speed',
}: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/12">
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/35 to-white/70"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      />
      <input
        type="range"
        aria-label={ariaLabel}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
