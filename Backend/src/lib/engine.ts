import { PLACEHOLDER, ICE_TEMP_C, MARGIN_LOW, MARGIN_HIGH, RISK_HOURS, type IceLevel } from "../config/shelfLife";

export type Risk = "low" | "moderate" | "high" | "critical";

export type Assessment = {
  risk: Risk | null;
  iceLevel: IceLevel | null;
  hoursElapsed: number;
  leftMinHours: number | null;
  leftMaxHours: number | null;
  hoursMin: number | null;
  hoursMax: number | null;
  minsMin: number | null;
  minsMax: number | null;
  sellBy: string | null; // earliest safe time: now + the cautious end of the range
  reason: string | null;
  placeholder: boolean;
};

const HOUR = 3_600_000;
const round1 = (n: number) => Math.round(n * 10) / 10;

// No thermometer: only how much ice there is compared with the weight of the fish
export function iceLevel(iceKg: number, fishKg: number): IceLevel {
  if (iceKg <= 0) return "none";
  const ratio = iceKg / Math.max(fishKg, 1);
  if (ratio < 0.25) return "low";
  if (ratio < 0.5) return "fair";
  if (ratio < 1) return "good";
  return "plenty";
}

// how many times faster the fish spoils at tempC than at 0 C
const relativeRate = (tempC: number) => (1 + 0.1 * tempC) ** 2;

export function riskFor(midHoursLeft: number): Risk {
  if (midHoursLeft <= RISK_HOURS.critical) return "critical";
  if (midHoursLeft <= RISK_HOURS.high) return "high";
  if (midHoursLeft <= RISK_HOURS.moderate) return "moderate";
  return "low";
}

export function assess(
  c: { caughtAt: Date; kilos: number },
  events: { at: Date; iceKg: number }[],
  species: { l0Min: number | null; l0Max: number | null; histamine: boolean },
  now: Date = new Date()
): Assessment {
  const nowMs = now.getTime();
  const hoursElapsed = round1(Math.max(0, (nowMs - c.caughtAt.getTime()) / HOUR));

  if (species.l0Min === null || species.l0Max === null) {
    return {
      risk: null,
      iceLevel: null,
      hoursElapsed,
      leftMinHours: null,
      leftMaxHours: null,
      hoursMin: null,
      hoursMax: null,
      minsMin: null,
      minsMax: null,
      sellBy: null,
      reason: "No shelf-life data for this species yet",
      placeholder: PLACEHOLDER,
    };
  }
  const { l0Min, l0Max, histamine } = species;

  // shelf life with this much ice on the fish
  const lifeAt = (iceKg: number) => {
    const rate = relativeRate(ICE_TEMP_C[iceLevel(iceKg, c.kilos)]);
    const min = (l0Min / rate) * MARGIN_LOW;
    // tuna and mackerel: no optimistic end, the cautious number is the number
    const max = histamine ? min : (l0Max / rate) * MARGIN_HIGH;
    return { min, max };
  };

  // the first event is the catch itself, every later one is ice added
  const timeline = events.length
    ? [...events].sort((a, b) => a.at.getTime() - b.at.getTime())
    : [{ at: c.caughtAt, iceKg: 0 }];

  // each stretch of time with the same ice uses up a share of the shelf life
  let usedMin = 0;
  let usedMax = 0;
  timeline.forEach((ev, i) => {
    const from = ev.at.getTime();
    const to = Math.min(nowMs, timeline[i + 1]?.at.getTime() ?? nowMs);
    if (to <= from) return;
    const life = lifeAt(ev.iceKg);
    usedMin += (to - from) / HOUR / life.min;
    usedMax += (to - from) / HOUR / life.max;
  });

  // what is left lasts according to the ice on the fish right now
  const last = timeline[timeline.length - 1];
  const life = lifeAt(last.iceKg);
  const leftMin = Math.max(0, (1 - usedMin) * life.min);
  const leftMax = Math.max(0, (1 - usedMax) * life.max);
  const hoursMin = Math.floor(leftMin + 0.1);

  return {
    risk: riskFor((leftMin + leftMax) / 2),
    iceLevel: iceLevel(last.iceKg, c.kilos),
    hoursElapsed,
    leftMinHours: round1(leftMin),
    leftMaxHours: round1(leftMax),
    hoursMin,
    hoursMax: Math.max(hoursMin, Math.ceil(leftMax - 0.1)),
    minsMin: Math.floor(leftMin * 60),
    minsMax: Math.floor(leftMax * 60),
    sellBy: new Date(nowMs + leftMin * HOUR).toISOString(),
    reason: null,
    placeholder: PLACEHOLDER,
  };
}