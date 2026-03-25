/**
 * Photos app content — edit to add your images and organize albums.
 *
 * - GALLERY_PHOTOS: ordered list. Each index matches desktop widget `galleryIndex`
 *   when picking from the gallery import modal.
 * - Put files in `public/gallery/...` (or any public URL) and set `src`.
 * - GALLERY_ALBUMS: each album lists zero-based indexes into GALLERY_PHOTOS.
 */

const LEGACY_COUNT = 35

export const GALLERY_PHOTOS = Array.from({ length: LEGACY_COUNT }, (_, i) => ({
  id: `photo-${i + 1}`,
  src: `/gallery/photo-${i + 1}.png`,
  title: `Photo ${i + 1}`,
  date: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
}))

/** @type {{ id: string, title: string, photoIndexes: number[] }[]} */
export const GALLERY_ALBUMS = [
  {
    id: 'vacation',
    title: 'Vacation',
    photoIndexes: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    id: 'screenshots',
    title: 'Screenshots',
    photoIndexes: [8, 9, 10, 11, 12, 13, 14],
  },
  {
    id: 'portraits',
    title: 'Portraits',
    photoIndexes: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    id: 'desktop-motivation',
    title: 'Desktop & motivation',
    photoIndexes: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  },
]
