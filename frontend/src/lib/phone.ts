export function normalizePhPhone(input: string): string | null {
  const d = input.replace(/[\s\-()]/g, "");
  const m = d.match(/^(?:\+?63|0)?(9\d{9})$/);
  return m ? `+63${m[1]}` : null;
}

export const toGatewayFormat = (e164: string) => e164.replace("+", "");

// Your User.mobile may be stored as 09…, 639… or +639…, so match all of them.
export const mobileVariants = (e164: string) => {
  const n = e164.slice(3);
  return [e164, `63${n}`, `0${n}`, n];
};