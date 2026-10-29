import {
  PLACEHOLDER,
  KG_PER_ICE_SACK,
  ICE_FACTORS,
  NO_ICE_FACTOR,
  MEDIUM_FROM,
  HIGH_FROM,
} from "../config/shelfLife";

export type Risk = "LOW" | "MEDIUM" | "HIGH";

export type Assessment = {
  risk: Risk | null;
  hoursElapsed: number;
  hoursLeft: number | null;
  sellBy: string | null;
  effectiveShelfLifeHours: number | null;
  reason: string | null;
  placeholder: boolean;
};

function iceFactor(iceSacks: number | null, kilos: number): number {
  if (!iceSacks || iceSacks <= 0) return NO_ICE_FACTOR;
  const ratio = (iceSacks * KG_PER_ICE_SACK) / kilos;
  const row = ICE_FACTORS.find((r) => ratio >= r.minRatio);
  return row ? row.factor : NO_ICE_FACTOR;
}

export function assess(
  c: { caughtAt: Date; kilos: number; iceSacks: number | null },
  shelfLifeHoursAt0C: number | null,
  now: Date = new Date()
): Assessment {
  const hoursElapsed = Math.max(0, (now.getTime() - c.caughtAt.getTime()) / 3_600_000);

  if (!shelfLifeHoursAt0C) {
    return {
      risk: null,
      hoursElapsed,
      hoursLeft: null,
      sellBy: null,
      effectiveShelfLifeHours: null,
      reason: "No shelf-life data for this species yet",
      placeholder: PLACEHOLDER,
    };
  }

  const effective = shelfLifeHoursAt0C * iceFactor(c.iceSacks, c.kilos);
  const used = hoursElapsed / effective;
  const risk: Risk = used >= HIGH_FROM ? "HIGH" : used >= MEDIUM_FROM ? "MEDIUM" : "LOW";

  return {
    risk,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursLeft: Math.max(0, Math.round((effective - hoursElapsed) * 10) / 10),
    sellBy: new Date(c.caughtAt.getTime() + effective * HIGH_FROM * 3_600_000).toISOString(),
    effectiveShelfLifeHours: Math.round(effective * 10) / 10,
    reason: null,
    placeholder: PLACEHOLDER,
  };
}