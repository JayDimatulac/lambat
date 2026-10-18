// SAMPLE forecast until a real weather source is connected. The screens label it as sample data.
// The shape below is what a real forecast (hourly and daily) would be turned into.
export const WEATHER_IS_LIVE = false

export type Sky = 'sun' | 'partly' | 'cloud' | 'rain'
export type Level = 'good' | 'caution' | 'danger'

export type Hour = { h: number; sky: Sky; wind: number; wave: number; rain: number } // wind km/h, wave metres, rain %
export type Day = { date: Date; sky: Sky; tMax: number; tMin: number; rain: number; wind: number; gust: number; wave: number }

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