/**
 * Weather in Fahrenheit: OpenWeatherMap when VITE_OPENWEATHER_API_KEY is set, else Open-Meteo.
 */

function pickLabelFromOw(json) {
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
  const desc = Array.isArray(c.weather) && c.weather[0]?.description ? c.weather[0].description : '—'
  const list = Array.isArray(f.list) ? f.list : []
  const hourly = list.slice(0, 8).map((slot) => {
    const tMs = slot.dt * 1000
    const tMain = slot.main || {}
    return {
      time: new Date(tMs).toISOString(),
      temp: tMain.temp,
    }
  })
  return {
    source: 'openweather',
    temp,
    feelsLike,
    description: desc,
    locationLabel: pickLabelFromOw(c),
    hourly,
  }
}

async function fetchOpenMeteoImperial(lat, lon) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code')
  url.searchParams.set('hourly', 'temperature_2m')
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
  const hourly = []
  for (let i = 0; i < Math.min(8, times.length); i += 1) {
    hourly.push({ time: times[i], temp: temps[i] })
  }
  const code = cur?.weather_code
  let description = 'Weather'
  if (code === 0) description = 'Clear sky'
  else if (code === 1 || code === 2) description = 'Mainly clear'
  else if (code === 3) description = 'Overcast'
  else if (code >= 45 && code <= 48) description = 'Fog'
  else if (code >= 51 && code <= 55) description = 'Drizzle'
  else if (code >= 61 && code <= 65) description = 'Rain'
  else if (code >= 71 && code <= 77) description = 'Snow'
  else if (code >= 95) description = 'Thunderstorm'

  return {
    source: 'open-meteo',
    temp,
    feelsLike,
    description,
    locationLabel: 'Local',
    hourly,
  }
}

/**
 * @returns {Promise<{ source: string, temp: number|null, feelsLike: number|null, description: string, locationLabel: string, hourly: {time: string, temp: number|null}[] }>}
 */
export async function fetchWeatherImperial(lat, lon) {
  const key = import.meta.env.VITE_OPENWEATHER_API_KEY
  if (typeof key === 'string' && key.trim().length > 0) {
    return fetchOpenWeather(lat, lon, key.trim())
  }
  return fetchOpenMeteoImperial(lat, lon)
}
