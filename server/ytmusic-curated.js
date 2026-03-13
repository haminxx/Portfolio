/**
 * Curated YouTube Music content.
 * Structure: { sections: [{ title, items: [{ title, artist, thumbnail, url?, videoId? }] }] }
 */
export const CURATED_SECTIONS = [
  {
    title: 'Rebel',
    subtitle: 'Rock anthems',
    items: [
      { title: 'Moon on the Water', artist: 'Beat Crusaders', videoId: 'KFyiHJz502E' },
      { title: 'City of God', artist: 'Idaho', videoId: null },
      { title: "Don't Look Back in Anger", artist: 'Oasis', videoId: 'r8OipmKFDeM' },
      { title: 'Wonderwall', artist: 'Oasis', videoId: 'vU05Eksc_iM' },
      { title: 'Judas Syndrome', artist: 'Old English Sheep Dog', videoId: null },
    ],
  },
  {
    title: 'Quick picks',
    subtitle: 'Based on your listening',
    items: [
      { title: 'Mix 1', artist: 'Various', thumbnail: null },
      { title: 'Mix 2', artist: 'Various', thumbnail: null },
      { title: 'Mix 3', artist: 'Various', thumbnail: null },
    ],
  },
  {
    title: 'Recommended for you',
    subtitle: null,
    items: [
      { title: 'Album 1', artist: 'Artist', thumbnail: null },
      { title: 'Album 2', artist: 'Artist', thumbnail: null },
      { title: 'Album 3', artist: 'Artist', thumbnail: null },
      { title: 'Album 4', artist: 'Artist', thumbnail: null },
      { title: 'Album 5', artist: 'Artist', thumbnail: null },
      { title: 'Album 6', artist: 'Artist', thumbnail: null },
    ],
  },
]
