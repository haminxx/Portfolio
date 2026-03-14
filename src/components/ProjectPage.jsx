import { useState } from 'react'
import { Search, LayoutGrid, List, Folder, FileText, Star, Clock } from 'lucide-react'
import './ProjectPage.css'

const PROJECTS = [
  { id: '1', title: 'Portfolio Website', desc: 'Chrome-style portfolio with dock, windows, and app integrations.', type: 'folder', modified: '2024-03-10', icon: Folder },
  { id: '2', title: 'Task Manager', desc: 'Full-stack task management app with real-time updates.', type: 'folder', modified: '2024-02-28', icon: Folder },
  { id: '3', title: 'API Dashboard', desc: 'Monitoring dashboard for API health and analytics.', type: 'folder', modified: '2024-02-15', icon: Folder },
  { id: '4', title: 'README.md', desc: 'Project documentation', type: 'file', modified: '2024-03-01', icon: FileText },
  { id: '5', title: 'Design System', desc: 'UI components and design tokens', type: 'folder', modified: '2024-01-20', icon: Folder },
]

export default function ProjectPage() {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarActive, setSidebarActive] = useState('myDrive')
  const [sortBy, setSortBy] = useState('modified')

  const filtered = PROJECTS.filter(
    (p) => !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title)
    return (b.modified || '').localeCompare(a.modified || '')
  })

  return (
    <div className="project-page">
      <header className="project-page__toolbar">
        <div className="project-page__search-wrap">
          <Search size={20} strokeWidth={1.5} className="project-page__search-icon" />
          <input
            type="text"
            placeholder="Search in My Drive"
            className="project-page__search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="project-page__toolbar-actions">
          <div className="project-page__view-toggle">
            <button
              type="button"
              className={`project-page__view-btn ${viewMode === 'grid' ? 'project-page__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={20} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={`project-page__view-btn ${viewMode === 'list' ? 'project-page__view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={20} strokeWidth={1.5} />
            </button>
          </div>
          <select
            className="project-page__sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="modified">Last modified</option>
            <option value="name">Name</option>
          </select>
        </div>
      </header>
      <div className="project-page__layout">
        <aside className="project-page__sidebar">
          <button
            type="button"
            className={`project-page__sidebar-item ${sidebarActive === 'myDrive' ? 'project-page__sidebar-item--active' : ''}`}
            onClick={() => setSidebarActive('myDrive')}
          >
            <Folder size={20} strokeWidth={1.5} />
            <span>My Drive</span>
          </button>
          <button
            type="button"
            className={`project-page__sidebar-item ${sidebarActive === 'recent' ? 'project-page__sidebar-item--active' : ''}`}
            onClick={() => setSidebarActive('recent')}
          >
            <Clock size={20} strokeWidth={1.5} />
            <span>Recent</span>
          </button>
          <button
            type="button"
            className={`project-page__sidebar-item ${sidebarActive === 'starred' ? 'project-page__sidebar-item--active' : ''}`}
            onClick={() => setSidebarActive('starred')}
          >
            <Star size={20} strokeWidth={1.5} />
            <span>Starred</span>
          </button>
        </aside>
        <main className={`project-page__main project-page__main--${viewMode}`}>
          <div className="project-page__grid">
            {sorted.map((p) => {
              const Icon = p.icon ?? Folder
              return (
                <div key={p.id} className="project-page__card">
                  <div className="project-page__card-icon">
                    <Icon size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="project-page__card-title">{p.title}</h3>
                  <p className="project-page__card-meta">Modified {p.modified}</p>
                  {viewMode === 'list' && (
                    <p className="project-page__card-desc">{p.desc}</p>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
