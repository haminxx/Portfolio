/**
 * TMDB (The Movie Database) API v3 client.
 * Free tier — sign up at https://www.themoviedb.org/settings/api
 * Set VITE_TMDB_API_KEY in your .env file.
 *
 * All functions gracefully return [] or null when the key is absent.
 */

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

/** Get a poster image URL. size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' */
export function getTMDBPosterUrl(path, size = 'w342') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

/** Get a backdrop image URL. size: 'w300' | 'w780' | 'w1280' | 'original' */
export function getTMDBBackdropUrl(path, size = 'w780') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

async function tmdbFetch(endpoint, params = {}) {
  if (!API_KEY) return null
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }
  try {
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Trending movies or TV.
 * @param {'movie'|'tv'|'all'} mediaType
 * @param {'day'|'week'} timeWindow
 */
export async function fetchTMDBTrending(mediaType = 'all', timeWindow = 'week') {
  const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`)
  return data?.results ?? []
}

/**
 * Discover by genre.
 * Common genre IDs: 28=Action, 35=Comedy, 18=Drama, 27=Horror, 16=Animation, 878=Sci-Fi
 */
export async function fetchTMDBDiscover(genreId, mediaType = 'movie', page = 1) {
  const data = await tmdbFetch(`/discover/${mediaType}`, {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
  })
  return data?.results ?? []
}

/** Search movies + TV in one call. */
export async function fetchTMDBSearch(query) {
  if (!query?.trim()) return []
  const data = await tmdbFetch('/search/multi', { query })
  return (data?.results ?? []).filter((r) => r.media_type !== 'person')
}

/** Get full details + videos (trailers) for a single item. */
export async function fetchTMDBDetails(id, mediaType = 'movie') {
  const data = await tmdbFetch(`/${mediaType}/${id}`, { append_to_response: 'videos,credits' })
  return data ?? null
}

/**
 * Get the YouTube trailer key for a TMDB item's videos result.
 * Returns null if no trailer found.
 */
export function getTrailerKey(videos) {
  if (!videos?.results?.length) return null
  const trailer =
    videos.results.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
    ) ??
    videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
    videos.results.find((v) => v.site === 'YouTube')
  return trailer?.key ?? null
}

/** True when a TMDB API key is configured. */
export function hasTMDBKey() {
  return Boolean(API_KEY)
}
