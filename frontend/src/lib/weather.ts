import { useEffect, useMemo, useState } from 'react'
import { api } from './api'

// The sample forecast is what shows when the real one can't be loaded. Screens label it as sample data.
// Kept for older screens that import it; use useForecast().live to know whether real data is showing.
export const WEATHER_IS_LIVE = false

export type Sky = 'sun' | 'partly' | 'cloud' | 'rain'
export type Level = 'good' | 'caution' | 'danger'

export type Hour = { h: number; sky: Sky; wind: number; wave: number; rain: number } // wind km/h, wave metres, rain %
export type Day = { date: Date; sky: Sky; tMax: number; tMin: number; rain: number; wind: number; gust: number; wave: number; waveEst?: boolean }

// Sail level. PLACEHOLDER limits: replace them with the guidance you follow, and always tell people to follow PAGASA and the Coast Guard.
export function sailLevel(wind: number, gust: number, wave: number, rain: number): Level {
  if (gust >= 50 || wave >= 2 || wind >= 35) return 'danger'
  if (gust >= 35 || wave >= 1.2 || wind >= 22 || rain >= 70) return 'caution'
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
  hours.forEach((x) => (sailLevel(x.wind, x.wind * 1.5, x.wave, x.rain) === 'good' ? (start ??= x.h) : close(x.h)))
  close(hours[hours.length - 1].h + 1)
  return best as { from: number; to: number } | null
}

export const hour12 = (h: number) => `${((h + 11) % 12) + 1} ${h % 24 < 12 ? 'AM' : 'PM'}`

/* ---------- the real forecast, from the backend ---------- */

type ApiForecast = {
  stale?: boolean
  hourly?: {
    time: string[]
    precipitation_probability: (number | null)[]
    wind_speed_10m: (number | null)[]
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
  waves?: { hourly?: { time: string[]; wave_height: (number | null)[] } | null } | null
}

export type Forecast = { week: Day[]; hours: Hour[]; live: boolean; stale: boolean }

// Approximate coordinates of the landing places on the sign-up list. Anything else uses the server's default (Balayan).
const COORDS: Record<string, [number, number]> = {
  Balayan: [13.94, 120.73],
  Calatagan: [13.83, 120.63],
  Lemery: [13.88, 120.91],
  Tuy: [14.02, 120.73],
  'Batangas City': [13.76, 121.06],
}

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

  const week: Day[] = d.time.map((iso, i) => {
    const wind = Math.round(d.wind_speed_10m_max[i] ?? 0)
    const gust = d.wind_gusts_10m_max?.[i]
    const measured = waveMax(iso)
    return {
      date: new Date(`${iso}T12:00:00`),
      sky: skyOf(d.weather_code[i]),
      tMax: Math.round(d.temperature_2m_max[i] ?? 0),
      tMin: Math.round(d.temperature_2m_min[i] ?? 0),
      rain: Math.round(d.precipitation_probability_max[i] ?? 0),
      wind,
      gust: typeof gust === 'number' ? Math.round(gust) : Math.round(wind * 1.5),
      wave: measured ?? estWave(wind),
      waveEst: measured === null,
    }
  })

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
      hours.push({
        h: hr,
        sky: skyOf(h.weather_code[i]),
        wind,
        rain: Math.round(h.precipitation_probability[i] ?? 0),
        wave: waveAt(stamp) ?? estWave(wind),
      })
    })
  }

  return { week, hours: hours.length ? hours : todayHours(), live: true, stale: !!r.stale }
}

// The forecast for a landing place. Shows the labeled sample until the real one arrives, and keeps showing it if it never does.
export function useForecast(landing?: string): Forecast {
  const [data, setData] = useState<Forecast | null>(null)

  useEffect(() => {
    let off = false
    const c = landing ? COORDS[landing] : undefined
    const q = c ? `?lat=${c[0]}&lon=${c[1]}` : ''
    const load = () => {
      api
        .get<ApiForecast>(`/weather${q}`)
        .then((r) => { if (!off) setData(fromApi(r)) })
        .catch(() => { /* keep what is on screen */ })
    }
    load()
    const id = setInterval(load, 15 * 60 * 1000)
    return () => {
      off = true
      clearInterval(id)
    }
  }, [landing])

  return useMemo(() => data ?? { week: weekFrom(new Date()), hours: todayHours(), live: false, stale: false }, [data])
}