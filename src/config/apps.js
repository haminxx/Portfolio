/**
 * Dock app icons and URLs. Add real URLs later for opening in new window or iframe.
 */
export const APPS = {
  finder: {
    label: 'Finder',
    domain: 'finder.local',
    icon: 'finder',
    iconPath: '/dock-icons/finder.png',
  },
  chrome: {
    label: 'Chrome',
    domain: 'portfolio.local',
    icon: 'chrome',
    iconPath: '/dock-icons/chrome.png',
  },
  instagram: {
    label: 'Instagram',
    domain: 'instagram.com/85liez',
    icon: 'instagram',
    iconPath: '/dock-icons/instagram.png',
  },
  netflix: {
    label: 'Netflix',
    domain: 'netflix.com',
    icon: 'netflix',
    iconPath: '/dock-icons/netflix.png',
  },
  photos: {
    label: 'Photos',
    domain: 'photos.local',
    icon: 'photos',
    iconPath: '/dock-icons/photos.png',
  },
  notes: {
    label: 'Notes',
    domain: 'notes.local',
    icon: 'notes',
    iconPath: '/dock-icons/notes.png',
  },
  facetime: {
    label: 'FaceTime',
    domain: 'facetime.local',
    icon: 'facetime',
    iconPath: '/dock-icons/facetime.png',
  },
  appStore: {
    label: 'App Store',
    domain: 'appstore.local',
    icon: 'appStore',
    iconPath: '/dock-icons/appstore.png',
  },
  settings: {
    label: 'Settings',
    domain: 'settings.local',
    icon: 'settings',
    iconPath: '/dock-icons/settings.png',
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
    iconPath: '/dock-icons/doom.png',
    url: 'https://dos.zone/doom-dec-1993',
  },
  dadnme: {
    label: "Dad 'n Me",
    domain: 'dadnme.local',
    icon: 'dadnme',
    iconPath: '/dock-icons/dadnme.png',
  },
}

export function getDomainForApp(appKey) {
  return APPS[appKey]?.domain ?? 'portfolio.local'
}
