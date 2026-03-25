/**
 * Photos app: flat photo list + albums. Set category: 'me' for portraits (face) — those appear in "Me".
 * All others are in "Background". Indices are stable for desktop photo widgets (galleryIndex).
 */

const LEGACY = Array.from({ length: 35 }, (_, i) => ({
  id: `photo-${i + 1}`,
  src: `/gallery/photo-${i + 1}.png`,
  title: `Photo ${i + 1}`,
  date: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  category: 'background',
}))

const IMPORTED_META = [
  { title: 'No risk no story', date: '2025-01-12' },
  { title: "Don't quit", date: '2025-01-13' },
  { title: 'Horse & rider', date: '2025-01-14' },
  { title: 'Dancing figure', date: '2025-01-15' },
  { title: 'No risk. No story', date: '2025-01-16' },
  { title: 'Three runners', date: '2025-01-17' },
  { title: 'Why not?', date: '2025-01-18' },
  { title: 'Inspiration menu', date: '2025-01-19' },
  { title: 'Swirl mark', date: '2025-01-20' },
  { title: 'Penguin sketch', date: '2025-01-21' },
]

const IMPORTED = IMPORTED_META.map((meta, j) => {
  const n = 36 + j
  return {
    id: `photo-${n}`,
    src: `/gallery/photo-${n}.png`,
    title: meta.title,
    date: meta.date,
    category: 'background',
  }
})

export const GALLERY_PHOTOS = [...LEGACY, ...IMPORTED]

function indexesWhere(pred) {
  return GALLERY_PHOTOS.map((p, i) => (pred(p) ? i : null)).filter((i) => i != null)
}

/** @type {{ id: string, title: string, photoIndexes: number[] }[]} */
export const GALLERY_ALBUMS = [
  {
    id: 'me',
    title: 'Me',
    photoIndexes: indexesWhere((p) => p.category === 'me'),
  },
  {
    id: 'background',
    title: 'Background',
    photoIndexes: indexesWhere((p) => p.category !== 'me'),
  },
]
