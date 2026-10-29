// PLACEHOLDER VALUES. Replace every number below with the ones from your
// research table / estimator.ts, then set PLACEHOLDER to false.
export const PLACEHOLDER = true;

// TODO: real weight of one sako of ice, in kg
export const KG_PER_ICE_SACK = 25;

// TODO: how well the ice keeps the fish cold. ratio = ice kg / fish kg.
// factor multiplies the shelf life at 0 C (1 = as good as 0 C).
// Rows are checked from the top, first match wins.
export const ICE_FACTORS: { minRatio: number; factor: number }[] = [
  { minRatio: 1.0, factor: 1.0 },
  { minRatio: 0.5, factor: 0.7 },
  { minRatio: 0.25, factor: 0.5 },
  { minRatio: 0.0001, factor: 0.35 },
];
export const NO_ICE_FACTOR = 0.25;

// TODO: share of the shelf life used up when risk changes level
export const MEDIUM_FROM = 0.5;
export const HIGH_FROM = 0.8;