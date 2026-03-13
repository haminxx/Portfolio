/**
 * Taskbar app icons and domain display strings.
 * Add real URLs later for opening in new window or iframe.
 */
export const APPS = {
  youtube: {
    label: 'YouTube Music',
    domain: 'music.youtube.com',
    icon: 'youtube',
  },
  instagram: {
    label: 'Instagram',
    domain: 'instagram.com/85liez',
    icon: 'instagram',
  },
  linkedin: {
    label: 'LinkedIn',
    domain: 'linkedin.com/in/85liez',
    icon: 'linkedin',
  },
  netflix: {
    label: 'Netflix',
    domain: 'netflix.com',
    icon: 'netflix',
  },
}

export function getDomainForApp(appKey) {
  return APPS[appKey]?.domain ?? 'portfolio.local'
}
