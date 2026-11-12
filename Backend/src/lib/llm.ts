import { EXPLAIN_RULES, EXPLAIN_FORMAT } from "./explainPrompt";
import { ACTION_LABEL, REMINDER, RISK_LABEL, TEMPLATE_TEXT, type ExplainContext, type Lang } from "./explainContext";

export type { Lang };

export type Sections = {
  why: string; // Why this estimate?
  factors: string[]; // What affected the estimate?
  know: string; // What should I know?
  next: string[]; // What can I do next?
};

export type Explanation = {
  sections: Sections;
  reminder: string;
  text: string; // everything in one piece, for the "read aloud" button
  source: "ai" | "template";
};

function finish(sections: Sections, lang: Lang, source: Explanation["source"]): Explanation {
  const reminder = REMINDER[lang];
  const text = [sections.why, ...sections.factors, sections.know, ...sections.next, reminder].filter(Boolean).join(" ");
  return { sections, reminder, text, source };
}

// The plain answer used when the AI is off, slow, or says something that doesn't match the facts.
// It is built only from the context, so it can never disagree with the assessment.
export function template(ctx: ExplainContext): Sections {
  const lang = ctx.language;
  const t = TEMPLATE_TEXT[lang];
  const a = ctx.assessment;
  const urgent = a.riskLevel === "high" || a.riskLevel === "critical";
  const actions = ctx.allowedNextActions.slice(0, 2).map((x) => ACTION_LABEL[lang][x] ?? x);
  return {
    why: t.why(RISK_LABEL[lang][a.riskLevel] ?? a.riskLevel, a.remainingText, a.sellByText),
    factors: a.supportingFactors.slice(0, 3).map((f) => f.explanation),
    know: a.missingInformation[0] ?? "",
    next: [t.next(actions.join(t.or), a.sellByText, urgent)],
  };
}

// every number the AI writes must be one we gave it
export function numbersAreGrounded(text: string, ctx: unknown): boolean {
  const norm = (s: string) => String(Number(s.replace(",", ".")));
  const allowed = new Set((JSON.stringify(ctx).match(/\d+(?:\.\d+)?/g) ?? []).map(norm));
  const used = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return used.every((n) => allowed.has(norm(n)));
}

// the AI is asked for JSON; accept it even if it wraps it in a code fence
function parseSections(raw: string): Sections | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, max) : []);
  const out: Sections = { why: str(obj.why), factors: list(obj.factors, 3), know: str(obj.know), next: list(obj.next, 2) };
  if (!out.why || !out.know || out.factors.length === 0 || out.next.length === 0) return null;
  return out;
}

export async function explain(ctx: ExplainContext): Promise<Explanation> {
  const fallback = finish(template(ctx), ctx.language, "template");

  const key = process.env.LLM_API_KEY;
  const base = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!key || !base || !model) return fallback;

  const url = `${base.replace(/\/+$/, "")}/chat/completions`;
  const body = JSON.stringify({
    model,
    temperature: 0.2,
    max_tokens: 4000, // thinking tokens count toward this, so leave plenty of room
    reasoning_effort: "low", // Gemini 3 models always think; "low" keeps the answer fast
    messages: [
      { role: "system", content: `${EXPLAIN_RULES}\n\n${EXPLAIN_FORMAT}` },
      { role: "user", content: JSON.stringify(ctx) },
    ],
  });
  const BUSY = [429, 500, 502, 503, 504];
  const started = Date.now();
  const deadline = started + 20_000; // the fisher never waits more than about 20 seconds in total

  try {
    let res: Response | null = null;
    // the provider is sometimes briefly overloaded: try twice, but only while there is time left
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 4_000) break;
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body,
        signal: AbortSignal.timeout(left),
      });
      if (res.ok || !BUSY.includes(res.status)) break;
      console.error("LLM busy, status", res.status);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    }
    if (!res || !res.ok) {
      console.error("LLM gave no answer, status", res?.status);
      return fallback;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[] };
    const raw = data.choices?.[0]?.message?.content?.trim();
    const sections = raw ? parseSections(raw) : null;
    if (!sections) {
      // show what the model really sent, so we can see why it did not fit
      console.error("LLM answer was not the JSON we asked for. finish_reason:", data.choices?.[0]?.finish_reason);
      console.error("LLM raw answer (first 600 characters):", raw ? raw.slice(0, 600) : "(empty)");
      return fallback;
    }
    const all = [sections.why, ...sections.factors, sections.know, ...sections.next].join(" ");
    const words = all.split(/\s+/).length;
    if (words > 220 || !numbersAreGrounded(all, ctx)) {
      console.error("LLM answer rejected (too long or a number we did not give it)");
      return fallback;
    }
    console.log(`LLM explanation ok in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return finish(sections, ctx.language, "ai");
  } catch (e) {
    console.error("LLM call failed:", e instanceof Error ? e.message : e);
    return fallback;
  }
}