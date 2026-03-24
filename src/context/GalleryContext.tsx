import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { GALLERY_SIZE, getImagePath } from '../lib/gallery'

type GalleryContextValue = {
  selectedPhotoIndex: number | null
  setSelectedPhotoIndex: (index: number | null) => void
  gallerySize: number
  getImagePath: (i: number) => string
}

const GalleryContext = createContext<GalleryContextValue | null>(null)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [selectedPhotoIndex, setSelectedPhotoIndexState] = useState<number | null>(null)

  const setSelectedPhotoIndex = useCallback((index: number | null) => {
    setSelectedPhotoIndexState(index)
  }, [])

  const value = useMemo(
    () => ({
      selectedPhotoIndex,
      setSelectedPhotoIndex,
      gallerySize: GALLERY_SIZE,
      getImagePath,
    }),
    [selectedPhotoIndex, setSelectedPhotoIndex],
  )

  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
}

export function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) {
    throw new Error('useGallery must be used within GalleryProvider')
  }
  return ctx
}
