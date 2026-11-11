import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { knownCoords } from './geo'

// The sample forecast is what shows when the real one can't be loaded. Screens label it as sample data.
// Kept for older screens that import it; use useForecast().live to know whether real data is showing.
export const WEATHER_IS_LIVE = false

export type Sky = 'sun' | 'partly' | 'cloud' | 'rain'
export type Level = 'good' | 'caution' | 'danger'

export type Hour = { h: number; sky: Sky; wind: number; wave: number; rain: number; gust?: number } // wind and gust km/h, wave metres, rain %
export type Day = { date: Date; sky: Sky; tMax: number; tMin: number; rain: number; wind: number; gust: number; wave: number; waveEst?: boolean }

// Sail level, from PAGASA's sea bulletins (km/h, wave height in metres):
//  - Moderate to strong winds: 38-59 km/h, waves 2.5-4.0 m. Small seacraft, including all motor bancas, must take precautions.
//  - Strong to gale-force winds: 48-71 km/h, waves 3.4 m and up. Sea travel is risky for small seacraft. Remain in port.
// 'danger' starts at the lowest small-craft level (41 km/h, 2.5 m). 'caution' keeps a margin below it, because bancas are small.
// Tighten or loosen these with your adviser or local fisherfolk, and always tell people to follow PAGASA and the Coast Guard.
export function sailLevel(wind: number, gust: number, wave: number, rain: number): Level {
  if (wind >= 41 || gust >= 55 || wave >= 2.5) return 'danger'
  if (wind >= 30 || gust >= 45 || wave >= 1.5 || rain >= 70) return 'caution'
  return 'good'
}

// How good the day is for drying fish, 0 to 5 racks
export function dryScore(d: Pick<Day, 'sky' | 'rain'>) {
  const base = { sun: 5, partly: 4, cloud: 2, rain: 0 }[d.sky]
  return Math.max(0, base - (d.rain >= 40 && d.sky !== 'rain' ? 1 : 0))
}

const PATTERN: Omit<Day, 'date'>[] = [
  { sky: 'partly', tMax: 32, tMin: 25, rain: 20, wind: 24, gust: 44, wave: 1.4 }, // today: the wind builds in the afternoon
  { sky: 'sun', tMax: 33, tMin: 25, rain: 5, wind: 14, gust: 24, wave: 0.8 },
  { sky: 'sun', tMax: 34, tMin: 26, rain: 5, wind: 12, gust: 20, wave: 0.7 },
  { sky: 'partly', tMax: 32, tMin: 25, rain: 30, wind: 18, gust: 30, wave: 1.0 },
  { sky: 'rain', tMax: 29, tMin: 24, rain: 80, wind: 28, gust: 46, wave: 1.9 },
  { sky: 'cloud', tMax: 30, tMin: 24, rain: 45, wind: 22, gust: 36, wave: 1.3 },
  { sky: 'sun', tMax: 33, tMin: 25, rain: 10, wind: 13, gust: 22, wave: 0.8 },
]

export function weekFrom(today: Date): Day[] {
  return PATTERN.map((p, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return { ...p, date }
  })
}

// Hour by hour for today, 5 AM to 7 PM
const WIND = [10, 10, 12, 14, 16, 18, 20, 24, 30, 38, 42, 44, 40, 32, 24]
const RAIN = [5, 5, 5, 10, 10, 10, 15, 20, 20, 30, 40, 40, 30, 20, 10]
export function todayHours(): Hour[] {
  return WIND.map((wind, i) => {
    const h = 5 + i
    const rain = RAIN[i]
    return { h, wind, rain, wave: Math.round((0.4 + wind / 32) * 10) / 10, sky: rain >= 40 ? 'cloud' : h >= 11 && h <= 15 ? 'partly' : 'sun' }
  })
}

// The stretch of hours when the wind is strong, and the longest calm stretch
export function windWindow(hours: Hour[]) {
  const strong = hours.filter((x) => x.wind >= 35)
  return strong.length ? { from: strong[0].h, to: strong[strong.length - 1].h + 1 } : null
}
export function calmWindow(hours: Hour[]) {
  let best: { from: number; to: number } | null = null
  let start: number | null = null
  const close = (end: number) => {
    if (start !== null && (!best || end - start > best.to - best.from)) best = { from: start, to: end }
    start = null
  }
  hours.forEach((x) => (sailLevel(x.wind, x.gust ?? x.wind * 1.5, x.wave, x.rain) === 'good' ? (start ??= x.h) : close(x.h)))
  close(hours[hours.length - 1].h + 1)
  return best as { from: number; to: number } | null
}
// For the Home chip: is it windy now, when does it ease, or when does it start? Wind, gusts and waves only (rain is left out).
export type WindOutlook = { kind: 'until'; to: number } | { kind: 'from'; from: number } | { kind: 'calm' } | { kind: 'none' }
export function windOutlook(hours: Hour[], nowHour: number): WindOutlook {
  const ahead = hours.filter((x) => x.h >= nowHour)
  if (!ahead.length) return { kind: 'none' } // the day is over
  const windy = (x: Hour) => sailLevel(x.wind, x.gust ?? x.wind * 1.5, x.wave, 0) !== 'good'
  const first = ahead.findIndex(windy)
  if (first < 0) return { kind: 'calm' }
  if (ahead[first].h > nowHour) return { kind: 'from', from: ahead[first].h }
  let end = first
  while (end + 1 < ahead.length && windy(ahead[end + 1])) end++
  return { kind: 'until', to: ahead[end].h + 1 }
}

export const hour12 = (h: number) => `${((h + 11) % 12) + 1} ${h % 24 < 12 ? 'AM' : 'PM'}`

/* ---------- the real forecast, from the backend ---------- */

type ApiForecast = {
  stale?: boolean
  current?: { time?: string; weather_code?: number | null }
  hourly?: {
    time: string[]
    precipitation_probability: (number | null)[]
    wind_speed_10m: (number | null)[]
    wind_gusts_10m?: (number | null)[]
    weather_code: (number | null)[]
  }
  daily?: {
    time: string[]
    weather_code: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_probability_max: (number | null)[]
    wind_speed_10m_max: (number | null)[]
    wind_gusts_10m_max?: (number | null)[]
  }
  location?: { name?: string; lat: number; lon: number; isDefault?: boolean }
  waves?: { hourly?: { time: string[]; wave_height: (number | null)[] } | null } | null
}

// status: 'loading' while the first answer is on its way, 'live' for the real forecast, 'sample' when it could not be loaded
export type Forecast = { week: Day[]; hours: Hour[]; live: boolean; stale: boolean; place?: string; status: 'loading' | 'live' | 'sample' }

// WMO weather codes to the four skies the screens draw
function skyOf(code: number | null | undefined): Sky {
  if (typeof code !== 'number') return 'cloud'
  if (code <= 1) return 'sun'
  if (code === 2) return 'partly'
  if (code === 3 || code === 45 || code === 48) return 'cloud'
  if (code >= 71 && code <= 77) return 'cloud'
  return 'rain'
}

// Wave height is only forecast for a few days. Past that, it is estimated from the wind (same rule as the sample).
const estWave = (wind: number) => Math.round((0.4 + wind / 32) * 10) / 10

function fromApi(r: ApiForecast): Forecast {
  const d = r.daily
  if (!d || !d.time?.length) throw new Error('no forecast')

  const mTime = r.waves?.hourly?.time ?? []
  const mWave = r.waves?.hourly?.wave_height ?? []
  const waveAt = (stamp: string): number | null => {
    const i = mTime.indexOf(stamp)
    const v = i >= 0 ? mWave[i] : null
    return typeof v === 'number' ? Math.round(v * 10) / 10 : null
  }
  const waveMax = (iso: string): number | null => {
    let best = -1
    for (let i = 0; i < mTime.length; i++) {
      const v = mWave[i]
      if (mTime[i].startsWith(iso) && typeof v === 'number' && v > best) best = v
    }
    return best < 0 ? null : Math.round(best * 10) / 10
  }

  // today, 5 AM to 7 PM, by the forecast's own local date (Asia/Manila)
  const today = d.time[0]
  const hours: Hour[] = []
  const h = r.hourly
  if (h?.time) {
    h.time.forEach((stamp, i) => {
      if (!stamp.startsWith(today)) return
      const hr = Number(stamp.slice(11, 13))
      if (hr < 5 || hr > 19) return
      const wind = Math.round(h.wind_speed_10m[i] ?? 0)
      const g = h.wind_gusts_10m?.[i]
      hours.push({
        h: hr,
        sky: skyOf(h.weather_code[i]),
        wind,
        gust: typeof g === 'number' ? Math.round(g) : undefined,
        rain: Math.round(h.precipitation_probability[i] ?? 0),
        wave: waveAt(stamp) ?? estWave(wind),
      })
    })
  }

  // the hour it is now at the place itself (the forecast gives it in Asia/Manila)
  const nowHour = r.current?.time ? Number(r.current.time.slice(11, 13)) : new Date().getHours()

  const week: Day[] = d.time.map((iso, i) => {
    const wind = Math.round(d.wind_speed_10m_max[i] ?? 0)
    const gust = d.wind_gusts_10m_max?.[i]
    const measured = waveMax(iso)
    const rain = Math.round(d.precipitation_probability_max[i] ?? 0)
    let sky = skyOf(d.weather_code[i])
    // the daily code is the worst moment of the day: only call it rainy when rain is actually likely
    if (sky === 'rain' && rain < 50) sky = 'partly'
    const day: Day = {
      date: new Date(`${iso}T12:00:00`),
      sky,
      tMax: Math.round(d.temperature_2m_max[i] ?? 0),
      tMin: Math.round(d.temperature_2m_min[i] ?? 0),
      rain,
      wind,
      gust: typeof gust === 'number' ? Math.round(gust) : Math.round(wind * 1.5),
      wave: measured ?? estWave(wind),
      waveEst: measured === null,
    }
    if (i === 0) {
      // today: the sky right now, and only the hours still ahead. A windy morning that has passed is not a reason to stay in.
      if (typeof r.current?.weather_code === 'number') day.sky = skyOf(r.current.weather_code)
      const ahead = hours.filter((x) => x.h >= nowHour)
      if (ahead.length) {
        day.wind = Math.max(...ahead.map((x) => x.wind))
        day.gust = Math.max(...ahead.map((x) => x.gust ?? Math.round(x.wind * 1.5)))
        day.wave = Math.max(...ahead.map((x) => x.wave))
        day.rain = Math.max(...ahead.map((x) => x.rain))
      }
    }
    return day
  })

  return { week, hours: hours.length ? hours : todayHours(), live: true, stale: !!r.stale, place: r.location?.name, status: 'live' }
}

// The forecast for a landing place. While it loads, status is 'loading' and screens must not show a verdict.
// If it never loads, status is 'sample' and the labeled sample is what is left.
export function useForecast(landing?: string): Forecast {
  const [data, setData] = useState<Forecast | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let off = false
    setData(null) // a new place must never keep showing the old place's forecast
    setFailed(false)
    // known town: send its coordinates. Any other place: the server looks it up. No landing: server default.
    const c = knownCoords(landing)
    const q = c ? `?lat=${c[0]}&lon=${c[1]}&name=${encodeURIComponent(landing ?? '')}` : landing ? `?place=${encodeURIComponent(landing)}` : ''
    const load = () => {
      api
        .get<ApiForecast>(`/weather${q}`)
        .then((r) => { if (!off) { setData(fromApi(r)); setFailed(false) } })
        .catch(() => { if (!off) setFailed(true) }) // if a forecast is already on screen, it stays
    }
    load()
    const id = setInterval(load, 15 * 60 * 1000)
    return () => {
      off = true
      clearInterval(id)
    }
  }, [landing])

  return useMemo(
    () => data ?? { week: weekFrom(new Date()), hours: todayHours(), live: false, stale: false, status: failed ? ('sample' as const) : ('loading' as const) },
    [data, failed]
  )
}