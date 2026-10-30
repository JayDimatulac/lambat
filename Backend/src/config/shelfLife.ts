// PLACEHOLDER VALUES, copied as they are from the frontend estimator.ts.
// Replace each one with a figure you can cite, then set PLACEHOLDER to false.
export const PLACEHOLDER = true;

export type IceLevel = "none" | "low" | "fair" | "good" | "plenty";

// temperature of the fish at each ice level (ambient with no ice)
export const AMBIENT_C = 30;
export const ICE_TEMP_C: Record<IceLevel, number> = {
  none: AMBIENT_C,
  low: 18,
  fair: 10,
  good: 5,
  plenty: 2,
};

// margins on each end of the shelf-life range
export const MARGIN_LOW = 0.9;
export const MARGIN_HIGH = 1.1;

// risk by hours left (middle of the range)
export const RISK_HOURS = { critical: 2, high: 6, moderate: 14 };