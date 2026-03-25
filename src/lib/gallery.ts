import { GALLERY_PHOTOS, GALLERY_ALBUMS } from '../config/galleryManifest.js'

export const GALLERY_SIZE = GALLERY_PHOTOS.length

export type GalleryPhoto = (typeof GALLERY_PHOTOS)[number]
export type GalleryAlbum = (typeof GALLERY_ALBUMS)[number]

export function getImagePath(i: number): string {
  const p = GALLERY_PHOTOS[i]
  return p?.src ?? `/gallery/photo-${i + 1}.png`
}

export function getGalleryPhoto(i: number): GalleryPhoto | undefined {
  return GALLERY_PHOTOS[i]
}

export function getGalleryAlbums(): GalleryAlbum[] {
  return GALLERY_ALBUMS
}
