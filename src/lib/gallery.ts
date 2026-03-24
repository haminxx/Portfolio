export const GALLERY_SIZE = 24

export function getImagePath(i: number) {
  return `/gallery/photo-${i + 1}.png`
}
