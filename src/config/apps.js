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
    url: 'https://www.instagram.com/85liez/',
  },
  netflix: {
    label: 'Netflix',
    domain: 'netflix.com',
    icon: 'netflix',
    iconPath: '/dock-icons/netflix.png',
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
    iconPath: '/dock-icons/map.png',
  },
  youtubeMusic: {
    label: 'YouTube Music',
    domain: 'music.youtube.com',
    icon: 'youtubeMusic',
    iconPath: '/dock-icons/youtube-music.png',
  },
  doom: {
    label: 'Doom',
    domain: 'doom.local',
    icon: 'doom',
    url: 'https://dos.zone/player/doom/',
  },
}

export function getDomainForApp(appKey) {
  return APPS[appKey]?.domain ?? 'portfolio.local'
}
