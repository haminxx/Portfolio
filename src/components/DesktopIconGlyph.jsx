import { FileText, Gamepad2, Folder } from 'lucide-react'

const IMG = {
  doom: '/dock-icons/doom.png',
  dadnme: '/dock-icons/dadnme.png',
  tetris: '/dock-icons/tetris.png',
}

/**
 * Renders the same visual as a desktop shortcut (or file/folder fallback).
 */
export function DesktopIconGlyph({ item, size = 40, className = '' }) {
  if (!item) return <FileText size={size} strokeWidth={1.5} className={className} />
  if (item.type === 'folder') {
    return <Folder size={size} strokeWidth={1.5} className={className} />
  }
  if (item.type === 'file') {
    return <FileText size={size} strokeWidth={1.5} className={className} />
  }
  if (item.type === 'shortcut' && item.appKey && IMG[item.appKey]) {
    const src = IMG[item.appKey]
    const rounded = item.appKey === 'doom' ? 'desktop-icon-glyph__img' : 'desktop-icon-glyph__img desktop-icon-glyph__img--sq'
    return <img src={src} alt="" className={`${rounded} ${className}`.trim()} width={size} height={size} draggable={false} />
  }
  return <Gamepad2 size={size} strokeWidth={1.5} className={className} />
}
