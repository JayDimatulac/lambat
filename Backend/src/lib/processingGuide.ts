import type { Assessment } from "./engine";
import type { Lang } from "./explainContext";
import { numbersAreGrounded } from "./llm";
import { chatJson, extractJson } from "./llmClient";
import { PROCESSING_RULES, GUIDE_INTRO_FORMAT, FOLLOW_UP_FORMAT } from "./processingPrompt";

export type Step = { en: string; fil?: string };
export type ProcessingReference = {
  id: string;
  product: string;
  description: string;
  requiresIce: boolean;
  allowedRisks: ("LOW" | "MEDIUM")[];
  equipment: string[];
  ingredients: string[];
  preparation: string[];
  steps: Step[];
  safety: string[];
  source: { title: string; issuer: string; version: string | null; url: string | null };
  verified: boolean;
};

export type SuitabilityStatus = "SUITABLE" | "NOT_SUITABLE" | "UNVERIFIED";
export type Suitability = { status: SuitabilityStatus; reason: string | null };

// ---------- Suitability Validator (no AI involved) ----------
export function checkSuitability(a: Assessment, ref: ProcessingReference | null): Suitability {
  if (a.risk === "high" || a.risk === "critical") return { status: "NOT_SUITABLE", reason: "high_risk" };
  if (!a.risk) return { status: "UNVERIFIED", reason: "no_assessment" };
  if (!ref || !ref.verified) return { status: "UNVERIFIED", reason: "no_verified_guide" };
  const level = a.risk === "low" ? "LOW" : "MEDIUM";
  if (!ref.allowedRisks.includes(level)) return { status: "NOT_SUITABLE", reason: "risk_not_allowed" };
  if (ref.requiresIce && a.iceLevel === "none") return { status: "UNVERIFIED", reason: "ice_history_unknown" };
  return { status: "SUITABLE", reason: null };
}

const SUITABILITY_TEXT: Record<Lang, Record<string, string>> = {
  en: {
    high_risk: "LAMBAT cannot recommend processing this catch under its recorded conditions.",
    risk_not_allowed: "LAMBAT cannot recommend processing this catch under its recorded conditions.",
    no_assessment: "Processing eligibility has not been established.",
    no_verified_guide: "Verified instructions are not yet available for this product.",
    ice_history_unknown:
      "This product needs fish kept on ice from landing, and no ice was recorded. Processing eligibility has not been established.",
  },
  fil: {
    high_risk: "Hindi inirerekomenda ng LAMBAT ang pagproseso ng huling ito base sa mga naitalang kondisyon.",
    risk_not_allowed: "Hindi inirerekomenda ng LAMBAT ang pagproseso ng huling ito base sa mga naitalang kondisyon.",
    no_assessment: "Hindi pa napatutunayan kung puwede itong prosesuhin.",
    no_verified_guide: "Wala pang napatunayang gabay para sa produktong ito.",
    ice_history_unknown:
      "Kailangan ng produktong ito ang isdang nakayelo mula pagdaong, at walang naitalang yelo. Hindi pa napatutunayan kung puwede itong prosesuhin.",
  },
};
export const suitabilityMessage = (s: Suitability, lang: Lang) =>
  s.reason ? SUITABILITY_TEXT[lang][s.reason] ?? SUITABILITY_TEXT[lang].no_assessment : "";

export const DISCLAIMER: Record<Lang, string> = {
  en: "AI-assisted processing guidance is educational and does not certify product safety.",
  fil: "Ang gabay sa pagproseso na tinulungan ng AI ay pang-edukasyon lamang at hindi sertipikasyon ng kaligtasan ng produkto.",
};

export const stepText = (s: Step, lang: Lang) => (lang === "fil" && s.fil ? s.fil : s.en);

// ---------- context the AI sees ----------
export type ProcessingContext = {
  feature: "processing_guide";
  language: Lang;
  suitability: "suitable"; // the AI is only ever called after the backend says SUITABLE
  catch: { species: string; quantityKg: number; riskLevel: string; iceCondition: string | null };
  reference: {
    product: string;
    description: string;
    recommendation: string | null;
    equipment: string[];
    ingredients: string[];
    preparation: string[];
    steps: string[];
    safety: string[];
    source: ProcessingReference["source"];
  };
};

export function buildProcessingContext(i: {
  lang: Lang;
  species: string;
  kilos: number;
  a: Assessment;
  ref: ProcessingReference;
  recommendation: string | null;
}): ProcessingContext {
  return {
    feature: "processing_guide",
    language: i.lang,
    suitability: "suitable",
    catch: { species: i.species, quantityKg: i.kilos, riskLevel: i.a.risk ?? "unknown", iceCondition: i.a.iceLevel },
    reference: {
      product: i.ref.product,
      description: i.ref.description,
      recommendation: i.recommendation,
      equipment: i.ref.equipment,
      ingredients: i.ref.ingredients,
      preparation: i.ref.preparation,
      steps: i.ref.steps.map((s) => stepText(s, i.lang)),
      safety: i.ref.safety,
      source: i.ref.source,
    },
  };
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// ---------- AI call 1: intro + term explanations ----------
export type GuideIntro = { about: string; terms: { term: string; meaning: string }[]; source: "ai" | "template" };

function introTemplate(ctx: ProcessingContext): GuideIntro {
  const r = ctx.reference;
  const about = [r.description, r.recommendation].filter(Boolean).join(" ");
  return { about, terms: [], source: "template" };
}

// the intro may describe the product, but must never sound like an approval
const CLAIMS = /\b(safe|suitable|approved|certified|guaranteed)\b|ligtas|angkop|sertipika/i;

export async function explainGuide(ctx: ProcessingContext): Promise<GuideIntro> {
  const fallback = introTemplate(ctx);
  const raw = await chatJson(
    `${PROCESSING_RULES}\n\n${GUIDE_INTRO_FORMAT}`,
    JSON.stringify({ task: "guide_intro", ...ctx })
  );
  const obj = extractJson(raw);
  if (!obj) return fallback;

  const about = str(obj.about);
  const refText = JSON.stringify(ctx.reference).toLowerCase();
  const terms = (Array.isArray(obj.terms) ? obj.terms : [])
    .map((t) => ({ term: str((t as { term?: unknown })?.term), meaning: str((t as { meaning?: unknown })?.meaning) }))
    // a term only counts if the word really appears in the reference
    .filter((t) => t.term && t.meaning && refText.includes(t.term.toLowerCase()) && words(t.meaning) <= 30)
    .slice(0, 5);

  const all = [about, ...terms.map((t) => t.meaning)].join(" ");
  if (!about || words(about) > 90 || !numbersAreGrounded(all, ctx) || CLAIMS.test(all)) {
    console.error("Processing intro rejected (empty, too long, ungrounded number, or sounded like an approval)");
    return fallback;
  }
  return { about, terms, source: "ai" };
}

// ---------- AI call 2: follow-up questions ----------
export type FollowUp = { answer: string; supported: boolean; source: "ai" | "template" };

const NOT_COVERED: Record<Lang, string> = {
  en: "The verified guide does not cover that. Please check the source document or ask a local BFAR or fisheries office.",
  fil: "Hindi sakop ng napatunayang gabay ang tanong na iyan. Tingnan ang pinagmulang dokumento o magtanong sa lokal na BFAR o tanggapan ng pangisdaan.",
};

export async function askGuide(ctx: ProcessingContext, question: string): Promise<FollowUp> {
  const fallback: FollowUp = { answer: NOT_COVERED[ctx.language], supported: false, source: "template" };
  const raw = await chatJson(
    `${PROCESSING_RULES}\n\n${FOLLOW_UP_FORMAT}`,
    JSON.stringify({ task: "follow_up", question: question.slice(0, 300), ...ctx })
  );
  const obj = extractJson(raw);
  if (!obj) return fallback;

  const answer = str(obj.answer);
  if (obj.supported !== true || !answer) return fallback;
  if (words(answer) > 120 || !numbersAreGrounded(answer, ctx)) {
    console.error("Processing answer rejected (too long or a number we did not give it)");
    return fallback;
  }
  return { answer, supported: true, source: "ai" };
}