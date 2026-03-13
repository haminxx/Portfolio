/**
 * Dock app icons and URLs. Add real URLs later for opening in new window or iframe.
 */
export const APPS = {
  chrome: {
    label: 'Chrome',
    domain: 'portfolio.local',
    icon: 'chrome',
  },
  instagram: {
    label: 'Instagram',
    domain: 'instagram.com/85liez',
    icon: 'instagram',
  },
  netflix: {
    label: 'Netflix',
    domain: 'netflix.com',
    icon: 'netflix',
  },
  gallery: {
    label: 'Gallery',
    domain: 'gallery.local',
    icon: 'gallery',
  },
  appStore: {
    label: 'App Store',
    domain: 'appstore.local',
    icon: 'appStore',
  },
  settings: {
    label: 'Settings',
    domain: 'settings.local',
    icon: 'settings',
  },
  map: {
    label: 'Map',
    domain: 'map.local',
    icon: 'map',
  },
}

export function getDomainForApp(appKey) {
  return APPS[appKey]?.domain ?? 'portfolio.local'
}
