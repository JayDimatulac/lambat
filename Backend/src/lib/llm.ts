export type Lang = "en" | "fil";

export type Facts = {
  species: string;
  localNames: string[];
  kilos: number;
  hoursElapsed: number;
  iceLevel: string; // none | low | fair | good | plenty
  risk: "low" | "moderate" | "high" | "critical";
  hoursMin: number;
  hoursMax: number;
  histamine: boolean;
};

const RISK_FIL = { low: "mababa", moderate: "katamtaman", high: "mataas", critical: "kritikal" } as const;
const ICE_FIL: Record<string, string> = {
  none: "walang yelo",
  low: "kaunting yelo",
  fair: "katamtamang yelo",
  good: "sapat na yelo",
  plenty: "maraming yelo",
};

// The plain answer used when the AI is off, slow, or says something that doesn't match the facts
export function template(f: Facts, lang: Lang): string {
  const range = f.hoursMin === f.hoursMax ? `${f.hoursMin}` : `${f.hoursMin} to ${f.hoursMax}`;
  const urgent = f.risk === "high" || f.risk === "critical";
  if (lang === "fil") {
    const r = f.hoursMin === f.hoursMax ? `${f.hoursMin}` : `${f.hoursMin} hanggang ${f.hoursMax}`;
    return (
      `Antas ng panganib: ${RISK_FIL[f.risk]}. Humigit-kumulang ${r} oras ang natitira bago masira, ` +
      `batay sa tagal mula nang mahuli (${f.hoursElapsed} oras) at sa dami ng yelo (${ICE_FIL[f.iceLevel] ?? f.iceLevel}). ` +
      (urgent
        ? "Kaunti na lang ang oras, kaya mas ligtas na ibenta o ibahagi na agad."
        : "May oras pa, at makakatulong ang dagdag na yelo para tumagal ito.")
    );
  }
  return (
    `Risk level: ${f.risk}. About ${range} hours of freshness are left, based on how long ago it was caught ` +
    `(${f.hoursElapsed} hours) and the ice on it (${f.iceLevel}). ` +
    (urgent
      ? "Time is short, so selling or sharing soon is the safer choice."
      : "There is still time, and more ice helps it last longer.")
  );
}

// every number the AI writes must be one we gave it
function numbersAreGrounded(text: string, facts: Facts): boolean {
  const norm = (s: string) => String(Number(s.replace(",", ".")));
  const allowed = new Set((JSON.stringify(facts).match(/\d+(?:\.\d+)?/g) ?? []).map(norm));
  const used = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return used.every((n) => allowed.has(norm(n)));
}

export async function explain(
  facts: Facts,
  lang: Lang
): Promise<{ text: string; source: "ai" | "template" }> {
  const fallback = { text: template(facts, lang), source: "template" as const };

  const key = process.env.LLM_API_KEY;
  const base = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!key || !base || !model) return fallback;

  const system =
    "You explain a fish freshness estimate to a small-scale Filipino fisher. " +
    "Use ONLY the facts in the JSON the user sends. Do not add any number, species fact, " +
    "price, temperature or food-safety claim that is not in the JSON. " +
    "Never say the fish is safe or unsafe to eat and never give medical advice. " +
    "Explain why the risk level is what it is, using the hours since the catch, the ice level and the species. " +
    "If histamine is true, add that this kind of fish needs extra care when it warms up. " +
    "Write at most 4 short sentences, in " +
    (lang === "fil" ? "simple Filipino (Tagalog)." : "simple English.");

  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 800,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.error("LLM responded with status", res.status);
      return fallback;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text || text.length > 1200 || !numbersAreGrounded(text, facts)) return fallback;
    return { text, source: "ai" };
  } catch (e) {
    console.error("LLM call failed:", e instanceof Error ? e.message : e);
    return fallback;
  }
}