import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion'
import projects from '../data/appStoreTodayProjects.json'
import './AppStoreWindow.css'

const SECTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'games', label: 'Games' },
  { id: 'apps', label: 'Apps' },
  { id: 'arcade', label: 'Arcade' },
]

function TodayCard({ project, onOpen, layoutId, className = '' }) {
  const hasImg = typeof project.image === 'string' && project.image.trim().length > 0

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      onClick={() => onOpen(project.id)}
      className={`relative w-full overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 text-left shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-neutral-400 ${className}`}
      style={{ minHeight: 200 }}
    >
      <div className="absolute inset-0">
        {hasImg ? (
          <img src={project.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-neutral-300 via-neutral-200 to-neutral-400" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      </div>
      <div className="relative z-10 flex min-h-[200px] flex-col justify-end p-6 font-sans">
        <h3 className="text-2xl font-semibold tracking-tight text-white">{project.title}</h3>
        <p className="mt-1 text-sm font-medium text-white/85">{project.subtitle}</p>
      </div>
    </motion.button>
  )
}

function TodayExpanded({ project, onClose }) {
  const hasImg = typeof project.image === 'string' && project.image.trim().length > 0
  const layoutId = `today-card-${project.id}`

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 z-[100] flex items-stretch justify-stretch p-3 sm:p-6">
        <motion.div
          layoutId={layoutId}
          className="pointer-events-auto relative flex max-h-[calc(100vh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-2xl mx-auto my-auto"
          style={{ maxHeight: 'min(92vh, 900px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative shrink-0 overflow-hidden" style={{ minHeight: 220, maxHeight: '42vh' }}>
            {hasImg ? (
              <img src={project.image} alt="" className="h-full w-full min-h-[220px] object-cover" />
            ) : (
              <div className="min-h-[220px] w-full bg-gradient-to-br from-neutral-300 via-neutral-200 to-neutral-400" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 font-sans">
              <h2 className="text-3xl font-semibold tracking-tight text-white">{project.title}</h2>
              <p className="mt-1 text-base font-medium text-white/88">{project.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-xl transition hover:bg-white/25"
              aria-label="Close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-6 py-5 font-sans">
            <p className="text-[15px] leading-relaxed text-neutral-800">{project.description}</p>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function AppStoreWindow() {
  const [activeSection, setActiveSection] = useState('today')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)

  const expandedProject = expandedId ? projects.find((p) => p.id === expandedId) : null

  return (
    <div className="app-store-window relative flex h-full flex-col bg-neutral-100">
      <nav className="app-store-window__nav border-b border-neutral-200 bg-white">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`app-store-window__nav-item ${activeSection === s.id ? 'app-store-window__nav-item--active' : ''}`}
            onClick={() => {
              setActiveSection(s.id)
              setExpandedId(null)
            }}
          >
            {s.label}
          </button>
        ))}
        <button type="button" className="app-store-window__search-wrap" onClick={() => {}}>
          <Search size={16} />
          <span className="app-store-window__search-label">Search</span>
        </button>
      </nav>

      <LayoutGroup id="app-store-today">
        <main className="app-store-window__main flex-1 overflow-auto">
          {activeSection === 'today' ? (
            <div className="mx-auto max-w-xl space-y-5 pb-8 font-sans">
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Today</p>
              {projects.map((project) =>
                expandedId === project.id ? (
                  <div key={project.id} className="w-full" style={{ minHeight: 200 }} aria-hidden />
                ) : (
                  <TodayCard
                    key={project.id}
                    project={project}
                    layoutId={`today-card-${project.id}`}
                    onOpen={setExpandedId}
                  />
                ),
              )}
            </div>
          ) : (
            <>
              <section className="app-store-window__banner">
                <div className="app-store-window__banner-inner rounded-3xl bg-neutral-300" />
              </section>
              <section className="app-store-window__row">
                <h2 className="app-store-window__row-title">
                  {SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Today'}
                </h2>
                <div className="app-store-window__row-scroll">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      className="app-store-window__card app-store-window__card--large"
                      onClick={() => setSelectedCard({ section: activeSection, index: i })}
                    />
                  ))}
                </div>
              </section>
              <section className="app-store-window__row">
                <h2 className="app-store-window__row-title">Featured</h2>
                <div className="app-store-window__row-scroll">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <button
                      key={i}
                      type="button"
                      className="app-store-window__card"
                      onClick={() => setSelectedCard({ section: 'featured', index: i })}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        <AnimatePresence>
          {activeSection === 'today' && expandedProject && (
            <TodayExpanded key={expandedProject.id} project={expandedProject} onClose={() => setExpandedId(null)} />
          )}
        </AnimatePresence>
      </LayoutGroup>

      {selectedCard && (
        <div
          className="app-store-window__modal"
          role="dialog"
          aria-label="App details"
          onClick={() => setSelectedCard(null)}
        >
          <div className="app-store-window__modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="app-store-window__modal-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="app-store-window__modal-placeholder">App details — add your apps here.</p>
          </div>
        </div>
      )}
    </div>
  )
}
