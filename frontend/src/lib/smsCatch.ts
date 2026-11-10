export const newCatchRef = () => "C" + Math.random().toString(36).slice(2, 8).toUpperCase();

export function buildCatchSms(c: {
  ref: string;
  speciesCode: string;   // species.code ?? species.englishName
  kilos: number;
  iceKg: number;
  place: string;
  caughtAt: Date;
}) {
  const ph = new Date(c.caughtAt.getTime() + 8 * 3_600_000); // Philippine time
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${ph.getUTCFullYear()}${p(ph.getUTCMonth() + 1)}${p(ph.getUTCDate())}${p(ph.getUTCHours())}${p(ph.getUTCMinutes())}`;
  return [
    "LAMBAT", c.ref, c.speciesCode.toUpperCase(), c.kilos, c.iceKg,
    c.place.replace(/[|\n]/g, " ").toUpperCase(), stamp,
  ].join("|");
}

export const smsHref = (body: string) =>
  `sms:${import.meta.env.VITE_LAMBAT_SMS_NUMBER}?&body=${encodeURIComponent(body)}`;