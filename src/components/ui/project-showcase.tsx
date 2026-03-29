'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'

interface Project {
  title: string
  description: string
  year: string
  link: string
  image: string
}

const projects: Project[] = [
  {
    title: 'Portfolio OS',
    description: 'Chrome-style portfolio with dock, windows, shaders, and lazy-loaded apps.',
    year: '2025',
    link: 'https://github.com/haminxx',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop',
  },
  {
    title: 'Creative UI Lab',
    description: 'Interactive components, glass effects, and motion-driven landing experiments.',
    year: '2024',
    link: 'https://github.com/haminxx',
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop',
  },
  {
    title: 'Data & Maps',
    description: 'Leaflet heatmaps and location storytelling inside the desktop metaphor.',
    year: '2024',
    link: 'https://github.com/haminxx',
    image:
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop',
  },
  {
    title: 'Media & Play',
    description: 'Embedded experiences: music, gallery, and retro games in the dock.',
    year: '2023',
    link: 'https://github.com/haminxx',
    image:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop',
  },
]

export function ProjectShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [mousePosition])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setIsVisible(false)
  }

  const containerRect = containerRef.current?.getBoundingClientRect()

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative mx-auto w-full max-w-2xl rounded-xl bg-background px-6 py-16 text-foreground shadow-sm"
    >
      <h2 className="mb-8 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Selected work
      </h2>

      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
        style={{
          left: containerRect?.left ?? 0,
          top: containerRect?.top ?? 0,
          transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 100}px, 0)`,
          opacity: isVisible ? 1 : 0,
          transition:
            'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="relative h-[180px] w-[280px] overflow-hidden rounded-xl bg-secondary"
          style={{
            transform: isVisible ? 'scale(1)' : 'scale(0.92)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {projects.map((project, index) => (
            <img
              key={project.title}
              src={project.image}
              alt={project.title}
              className="absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                transform: hoveredIndex === index ? 'scale(1)' : 'scale(1.1)',
                filter: hoveredIndex === index ? 'none' : 'blur(10px)',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        </div>
      </div>

      <div className="space-y-0">
        {projects.map((project, index) => (
          <a
            key={project.title}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative border-t border-border py-5 transition-all duration-300 ease-out">
              <div
                className={`absolute inset-0 -mx-4 rounded-lg bg-secondary/50 px-4 transition-all duration-300 ease-out ${
                  hoveredIndex === index ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="text-lg font-medium tracking-tight text-foreground">
                      <span className="relative">
                        {project.title}
                        <span
                          className={`absolute -bottom-0.5 left-0 h-px bg-foreground transition-all duration-300 ease-out ${
                            hoveredIndex === index ? 'w-full' : 'w-0'
                          }`}
                        />
                      </span>
                    </h3>

                    <ArrowUpRight
                      className={`h-4 w-4 text-muted-foreground transition-all duration-300 ease-out ${
                        hoveredIndex === index
                          ? 'translate-x-0 translate-y-0 opacity-100'
                          : '-translate-x-2 translate-y-2 opacity-0'
                      }`}
                    />
                  </div>

                  <p
                    className={`mt-1 text-sm leading-relaxed transition-all duration-300 ease-out ${
                      hoveredIndex === index ? 'text-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {project.description}
                  </p>
                </div>

                <span
                  className={`font-mono text-xs tabular-nums text-muted-foreground transition-all duration-300 ease-out ${
                    hoveredIndex === index ? 'text-foreground/60' : ''
                  }`}
                >
                  {project.year}
                </span>
              </div>
            </div>
          </a>
        ))}

        <div className="border-t border-border" />
      </div>
    </section>
  )
}
