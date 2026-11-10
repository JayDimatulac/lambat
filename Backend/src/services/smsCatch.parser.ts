// Format: LAMBAT|ref|SPECIES|kilos|iceKg|PLACE|YYYYMMDDHHmm   (time is Philippine time)
// Example: LAMBAT|C7K2Q9|TUNA|15|5|BALAYAN|202611091430

export type ParsedCatch = {
  ref: string;
  speciesToken: string;
  kilos: number;
  iceKg: number;
  place: string | null;
  caughtAt: Date;
};
type R = { ok: true; data: ParsedCatch } | { ok: false; reason: string };

const fail = (reason: string): R => ({ ok: false, reason });
const NUM = /^\d{1,6}(\.\d{1,2})?$/;

export function parseCatchSms(body: string): R {
  const p = body.trim().toUpperCase().split("|").map((s) => s.trim());
  if (p.length !== 7 || p[0] !== "LAMBAT") return fail("format");
  const [, ref, species, kilosS, iceS, place, when] = p;

  if (!/^[A-Z0-9]{2,12}$/.test(ref)) return fail("catch reference");
  if (species.length < 2 || species.length > 60) return fail("species");
  if (!NUM.test(kilosS) || Number(kilosS) <= 0 || Number(kilosS) > 100000) return fail("kilos");
  if (!NUM.test(iceS) || Number(iceS) > 100000) return fail("ice");
  if (!/^[A-Z0-9 .,'-]{0,80}$/.test(place)) return fail("place");
  if (!/^\d{12}$/.test(when)) return fail("date/time");

  const y = +when.slice(0, 4), mo = +when.slice(4, 6), d = +when.slice(6, 8);
  const h = +when.slice(8, 10), mi = +when.slice(10, 12);
  if (h > 23 || mi > 59) return fail("date/time");

  const caughtAt = new Date(Date.UTC(y, mo - 1, d, h - 8, mi)); // PH time (UTC+8) -> UTC
  const ph = new Date(caughtAt.getTime() + 8 * 3_600_000);
  if (ph.getUTCFullYear() !== y || ph.getUTCMonth() !== mo - 1 || ph.getUTCDate() !== d)
    return fail("date/time");

  const now = Date.now();
  if (caughtAt.getTime() > now + 5 * 60_000) return fail("catch time is in the future");
  if (caughtAt.getTime() < now - 30 * 86_400_000) return fail("catch time is too old");

  return {
    ok: true,
    data: { ref, speciesToken: species, kilos: Number(kilosS), iceKg: Number(iceS), place: place || null, caughtAt },
  };
}