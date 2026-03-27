/**
 * Weather in Fahrenheit: OpenWeatherMap when VITE_OPENWEATHER_API_KEY is set, else Open-Meteo.
 */

function pickLabelFromOw(json) {
  const name = json?.name
  if (name && typeof name === 'string') return name
  const parts = [json?.name, json?.sys?.country].filter(Boolean)
  return parts.join(', ') || 'Local'
}

async function fetchOpenWeather(lat, lon, apiKey) {
  const base = `https://api.openweathermap.org/data/2.5`
  const curUrl = `${base}/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  const fcUrl = `${base}/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  const [cr, fr] = await Promise.all([fetch(curUrl), fetch(fcUrl)])
  if (!cr.ok) {
    const t = await cr.text()
    throw new Error(t.slice(0, 80) || 'OpenWeather current failed')
  }
  if (!fr.ok) {
    const t = await fr.text()
    throw new Error(t.slice(0, 80) || 'OpenWeather forecast failed')
  }
  const c = await cr.json()
  const f = await fr.json()
  const main = c.main || {}
  const temp = main.temp
  const feelsLike = main.feels_like
  const w0 = Array.isArray(c.weather) ? c.weather[0] : null
  const desc = w0?.description ? String(w0.description) : '—'
  const weatherCode = typeof w0?.id === 'number' ? w0.id : null
  const weatherMain = w0?.main ? String(w0.main) : ''

  const list = Array.isArray(f.list) ? f.list : []
  const hourly = list.slice(0, 8).map((slot) => {
    const tMs = slot.dt * 1000
    const tMain = slot.main || {}
    const sw = Array.isArray(slot.weather) ? slot.weather[0] : null
    const pop = typeof slot.pop === 'number' ? slot.pop : null
    return {
      time: new Date(tMs).toISOString(),
      temp: tMain.temp,
      pop,
      weatherMain: sw?.main ? String(sw.main) : '',
      weatherCode: typeof sw?.id === 'number' ? sw.id : null,
    }
  })

  return {
    source: 'openweather',
    temp,
    feelsLike,
    description: desc,
    weatherCode,
    weatherMain,
    locationLabel: pickLabelFromOw(c),
    hourly,
  }
}

async function fetchOpenMeteoImperial(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code')
  url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability')
  url.searchParams.set('forecast_days', '2')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Open-Meteo forecast failed')
  const data = await res.json()
  const cur = data.current
  const temp = cur?.temperature_2m
  const feelsLike = cur?.apparent_temperature ?? temp
  const times = data.hourly?.time ?? []
  const temps = data.hourly?.temperature_2m ?? []
  const codes = data.hourly?.weather_code ?? []
  const pops = data.hourly?.precipitation_probability ?? []
  const hourly = []
  for (let i = 0; i < Math.min(8, times.length); i += 1) {
    hourly.push({
      time: times[i],
      temp: temps[i],
      pop: typeof pops[i] === 'number' ? pops[i] / 100 : null,
      weatherMain: '',
      weatherCode: typeof codes[i] === 'number' ? codes[i] : null,
    })
  }
  const code = cur?.weather_code
  let description = 'Weather'
  if (code === 0) description = 'Clear'
  else if (code === 1 || code === 2) description = 'Mainly clear'
  else if (code === 3) description = 'Overcast'
  else if (code >= 45 && code <= 48) description = 'Fog'
  else if (code >= 51 && code <= 55) description = 'Drizzle'
  else if (code >= 61 && code <= 65) description = 'Rain'
  else if (code >= 71 && code <= 77) description = 'Snow'
  else if (code >= 95) description = 'Storm'

  return {
    source: 'open-meteo',
    temp,
    feelsLike,
    description,
    weatherCode: typeof code === 'number' ? code : null,
    weatherMain: '',
    locationLabel: 'Local',
    hourly,
  }
}

/**
 * Short condition + horizon for “rain next 2 hrs” style UI.
 */
export function buildWeatherNextHint(description, weatherMain, weatherCode, hourly) {
  const rainish = (main, code, pop) => {
    const m = (main || '').toLowerCase()
    if (m.includes('rain') || m.includes('drizzle') || m.includes('thunder') || m.includes('snow')) return true
    if (typeof pop === 'number' && pop >= 0.45) return true
    if (code != null) {
      const c = Number(code)
      if (c >= 200 && c < 600) return true
      if (c >= 51 && c <= 67) return true
      if (c >= 80 && c <= 82) return true
      if (c >= 95) return true
    }
    return false
  }

  const slots = hourly || []
  const h0 = slots[0]
  const h1 = slots[1]
  const p0 = h0?.pop
  const p1 = h1?.pop
  const soonRain =
    rainish(h0?.weatherMain, h0?.weatherCode, p0) || rainish(h1?.weatherMain, h1?.weatherCode, p1)

  if (soonRain) {
    const word = (description || 'rain').split(' ')[0] || 'rain'
    return { conditionWord: word, horizon: '2 hrs' }
  }

  const clearish = (weatherMain || '').toLowerCase().includes('clear') || (description || '').toLowerCase().includes('clear')
  if (clearish || (weatherCode === 0 || weatherCode === 1)) {
    return { conditionWord: description?.split(' ')[0] || 'Clear', horizon: '—' }
  }

  const short = (description || 'Fair').split(/[, ]+/).slice(0, 2).join(' ') || 'Fair'
  return { conditionWord: short, horizon: '—' }
}

export async function fetchWeatherImperial(lat, lon) {
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY
  if (typeof key === 'string' && key.trim().length > 0) {
    return fetchOpenWeather(lat, lon, key.trim())
  }
  return fetchOpenMeteoImperial(lat, lon)
}
