import { Router } from "express";
import { requireAuth } from "../middleware/auth";

export const weatherRouter = Router();

// Balayan, Batangas (used when the app doesn't send coordinates)
const DEFAULT_LAT = 13.94;
const DEFAULT_LON = 120.73;
const CACHE_MS = 15 * 60 * 1000;

const cache = new Map<string, { at: number; data: Record<string, unknown> }>();

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Open-Meteo responded ${r.status}`);
  return r.json();
}

weatherRouter.get("/", requireAuth, async (req, res) => {
  const lat = req.query.lat === undefined ? DEFAULT_LAT : Number(req.query.lat);
  const lon = req.query.lon === undefined ? DEFAULT_LON : Number(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  // round so nearby requests share one cache entry
  const la = lat.toFixed(2);
  const lo = lon.toFixed(2);
  const key = `${la},${lo}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    res.json({ ...hit.data, stale: false });
    return;
  }

  try {
    const forecast = await getJson(
      "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${la}&longitude=${lo}` +
        "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation" +
        "&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max" +
        "&timezone=Asia%2FManila&forecast_days=7"
    );

    // wave data is a bonus: inland points have none, so failure here is fine
    let waves: unknown = null;
    try {
      const marine = await getJson(
        "https://marine-api.open-meteo.com/v1/marine" +
          `?latitude=${la}&longitude=${lo}` +
          "&current=wave_height&hourly=wave_height&timezone=Asia%2FManila&forecast_days=3"
      );
      waves = { current: marine.current ?? null, hourly: marine.hourly ?? null };
    } catch {
      waves = null;
    }

    const data = {
      location: { lat: Number(la), lon: Number(lo) },
      fetchedAt: new Date().toISOString(),
      current: forecast.current,
      hourly: forecast.hourly,
      daily: forecast.daily,
      units: {
        current: forecast.current_units,
        hourly: forecast.hourly_units,
        daily: forecast.daily_units,
      },
      waves,
    };

    cache.set(key, { at: Date.now(), data });
    res.json({ ...data, stale: false });
  } catch (err) {
    console.error("Weather fetch failed:", err);
    if (hit) {
      // Open-Meteo is down: send the last good answer, flagged as old
      res.json({ ...hit.data, stale: true });
      return;
    }
    res.status(503).json({ error: "Weather is not available right now" });
  }
});