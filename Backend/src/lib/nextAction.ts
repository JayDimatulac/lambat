import type { Assessment } from "./engine";
import { duration, REMINDER, type Lang } from "./explainContext";
import { numbersAreGrounded } from "./llm";
import { chatJson, extractJson } from "./llmClient";
import { NEXT_ACTION_FORMAT, NEXT_ACTION_RULES } from "./nextActionPrompt";

export type ActionCode = "FIND_BUYER" | "SHARE_CATCH" | "ADD_ICE" | "EXPLORE_PROCESSING" | "REVIEW_CATCH";

// which rule picked the action (kept so the team can test and read the decision)
export type RuleCode =
  | "no_data"
  | "time_up"
  | "very_short"
  | "short_matches"
  | "short_no_matches"
  | "low_ice"
  | "buyer_matches"
  | "processing"
  | "no_matches_share"
  | "time_available";

export type Decision = { action: ActionCode; rule: RuleCode; allowed: ActionCode[] };

/* ---------- 1. THE RULES: the backend decides, the AI never does ----------
   STARTER RULES. They keep the old glow on the Fork (buyer first when there is time), and add the cases the
   placeholder did not have. Your team should read this one function and change it where it disagrees. */
export function decideNextAction(i: { a: Assessment; matchCount: number; pathwayEligible: boolean }): Decision {
  const { a, matchCount, pathwayEligible } = i;

  // no estimate: nothing to advise on
  if (!a.risk || !a.iceLevel || a.minsMin === null) return { action: "REVIEW_CATCH", rule: "no_data", allowed: ["REVIEW_CATCH"] };
  // the cautious selling time is used up: verify the fish before any further action
  if (a.minsMin <= 0) return { action: "REVIEW_CATCH", rule: "time_up", allowed: ["REVIEW_CATCH"] };

  // actions the app really offers for this catch (the same locks as the Fork and the pathways route)
  const allowed: ActionCode[] = [];
  if (a.risk !== "critical") allowed.push("FIND_BUYER");
  allowed.push("SHARE_CATCH");
  if (a.iceLevel !== "plenty") allowed.push("ADD_ICE");
  if (pathwayEligible) allowed.push("EXPLORE_PROCESSING");
  allowed.push("REVIEW_CATCH");

  const pick = (action: ActionCode, rule: RuleCode): Decision => ({ action, rule, allowed });
  const littleIce = a.iceLevel === "none" || a.iceLevel === "low";

  if (a.risk === "critical") return pick("SHARE_CATCH", "very_short");
  if (a.risk === "high") return matchCount > 0 ? pick("FIND_BUYER", "short_matches") : pick("SHARE_CATCH", "short_no_matches");
  if (a.risk === "moderate" && littleIce) return pick("ADD_ICE", "low_ice");
  if (matchCount > 0) return pick("FIND_BUYER", "buyer_matches");
  if (pathwayEligible) return pick("EXPLORE_PROCESSING", "processing");
  if (a.risk === "moderate") return pick("SHARE_CATCH", "no_matches_share");
  return pick("FIND_BUYER", "time_available");
}

/* ---------- 2. THE WORDS the backend already knows (English and Filipino) ---------- */
type Facts = { time: string; n: number; level: string };
type Words = { why: string; reasons: string[]; limitation: string };

const TITLE: Record<Lang, Record<ActionCode, string>> = {
  en: {
    FIND_BUYER: "Find a buyer",
    SHARE_CATCH: "Share your catch",
    ADD_ICE: "Add ice",
    EXPLORE_PROCESSING: "Look at a potential value-added pathway",
    REVIEW_CATCH: "Check the catch first",
  },
  fil: {
    FIND_BUYER: "Humanap ng mamimili",
    SHARE_CATCH: "Ibahagi ang huli mo",
    ADD_ICE: "Magdagdag ng yelo",
    EXPLORE_PROCESSING: "Tingnan ang posibleng pagpapalaki ng halaga",
    REVIEW_CATCH: "Suriin muna ang huli",
  },
};

const ICE: Record<Lang, Record<string, string>> = {
  en: { none: "none", low: "low", fair: "fair", good: "good", plenty: "plenty" },
  fil: { none: "walang yelo", low: "kaunti", fair: "katamtaman", good: "sapat", plenty: "marami" },
};

const COPY: Record<Lang, Record<RuleCode, (f: Facts) => Words>> = {
  en: {
    no_data: () => ({
      why: "LAMBAT cannot estimate the time left for this fish yet, so the catch needs a review.",
      reasons: ["There is no shelf-life data for this species yet."],
      limitation: "Without a time estimate, LAMBAT gives no selling advice.",
    }),
    time_up: (f) => ({
      why: "The cautious time to sell this catch has run out, so the catch needs a review.",
      reasons: [`The time left is ${f.time}.`, "The estimate cannot show whether the fish is still good."],
      limitation: "Check the fish yourself before you sell, share or process it.",
    }),
    very_short: (f) => ({
      why: "Very little time is left, so sharing is the suggested step.",
      reasons: [`Time left: ${f.time}.`, "Finding a buyer is not offered when this little time is left."],
      limitation: "Sharing does not guarantee the fish can be used, and the estimate does not show it is safe to eat.",
    }),
    short_matches: (f) => ({
      why: "Time is short, and a buyer need that matches this catch was found.",
      reasons: [`Time left: ${f.time}.`, f.n === 1 ? "1 open buyer need matches this catch." : `${f.n} open buyer needs match this catch.`],
      limitation: "A matching need does not mean the buyer will accept the catch.",
    }),
    short_no_matches: (f) => ({
      why: "Time is short and no buyer need matches right now, so sharing is suggested.",
      reasons: [`Time left: ${f.time}.`, "No open buyer need matches this catch right now."],
      limitation: "The search covers only the open buyer needs in LAMBAT right now.",
    }),
    low_ice: (f) => ({
      why: "The catch has little ice, so adding ice is the suggested step.",
      reasons: [`The ice level is "${f.level}", compared with the weight of your catch.`, `Time left: ${f.time}.`],
      limitation: "Adding ice does not guarantee more time. Record it so the estimate can be updated.",
    }),
    buyer_matches: (f) => ({
      why: "A buyer need that matches this catch was found, and there is time to reach out.",
      reasons: [f.n === 1 ? "1 open buyer need matches this catch." : `${f.n} open buyer needs match this catch.`, `Time left: ${f.time}.`],
      limitation: "A matching need does not mean the buyer will accept the catch.",
    }),
    processing: (f) => ({
      why: "No buyer need matches right now, and a value-added pathway is listed for this fish.",
      reasons: ["No open buyer need matches this catch right now.", "A potential value-added pathway is listed for this fish.", `Time left: ${f.time}.`],
      limitation: "A pathway is something to check, not approval to process. Check the conditions first.",
    }),
    no_matches_share: (f) => ({
      why: "No buyer need matches right now and time is getting short, so sharing is suggested.",
      reasons: ["No open buyer need matches this catch right now.", `Time left: ${f.time}.`],
      limitation: "The search covers only the open buyer needs in LAMBAT right now.",
    }),
    time_available: (f) => ({
      why: "There is still time to look for a buyer.",
      reasons: [`Time left: ${f.time}.`, "No open buyer need matches this catch right now."],
      limitation: "New buyer needs may appear later, and the estimate does not guarantee a sale.",
    }),
  },
  fil: {
    no_data: () => ({
      why: "Hindi pa matantiya ng LAMBAT ang natitirang oras ng isdang ito, kaya kailangang suriin ang huli.",
      reasons: ["Wala pang datos sa tagal bago masira ang uring ito."],
      limitation: "Kapag walang tantiya ng oras, walang payo ang LAMBAT sa pagbebenta.",
    }),
    time_up: (f) => ({
      why: "Tapos na ang maingat na oras para ibenta ang huling ito, kaya kailangan itong suriin.",
      reasons: [`Ang natitirang oras ay ${f.time}.`, "Hindi masasabi ng tantiya kung maganda pa ang isda."],
      limitation: "Tingnan mo mismo ang isda bago ibenta, ibahagi o iproseso.",
    }),
    very_short: (f) => ({
      why: "Kaunting-kaunti na lang ang oras, kaya ang pagbabahagi ang mungkahi.",
      reasons: [`Natitirang oras: ${f.time}.`, "Hindi inaalok ang paghahanap ng mamimili kapag ganito na kaunti ang oras."],
      limitation: "Hindi garantiya ng pagbabahagi na magagamit pa ang isda, at hindi ipinapakita ng tantiya na ligtas itong kainin.",
    }),
    short_matches: (f) => ({
      why: "Kaunti na lang ang oras, at may nakitang pangangailangan ng mamimili na tugma sa huling ito.",
      reasons: [
        `Natitirang oras: ${f.time}.`,
        f.n === 1 ? "1 bukas na pangangailangan ng mamimili ang tugma sa huling ito." : `${f.n} bukas na pangangailangan ng mamimili ang tugma sa huling ito.`,
      ],
      limitation: "Hindi ibig sabihin ng tugmang pangangailangan na tatanggapin ng mamimili ang huli.",
    }),
    short_no_matches: (f) => ({
      why: "Kaunti na lang ang oras at wala pang tugmang pangangailangan ng mamimili, kaya ang pagbabahagi ang mungkahi.",
      reasons: [`Natitirang oras: ${f.time}.`, "Walang bukas na pangangailangan ng mamimili na tugma sa huling ito ngayon."],
      limitation: "Ang mga bukas na pangangailangan ng mamimili sa LAMBAT ngayon lang ang sakop ng paghahanap.",
    }),
    low_ice: (f) => ({
      why: "Kaunti ang yelo ng huli, kaya ang pagdagdag ng yelo ang mungkahi.",
      reasons: [`Ang yelo ay "${f.level}" kumpara sa bigat ng huli mo.`, `Natitirang oras: ${f.time}.`],
      limitation: "Hindi garantiya ng dagdag na yelo na madadagdagan ang oras. Itala ito para ma-update ang tantiya.",
    }),
    buyer_matches: (f) => ({
      why: "May nakitang pangangailangan ng mamimili na tugma sa huling ito, at may oras pa para lapitan.",
      reasons: [
        f.n === 1 ? "1 bukas na pangangailangan ng mamimili ang tugma sa huling ito." : `${f.n} bukas na pangangailangan ng mamimili ang tugma sa huling ito.`,
        `Natitirang oras: ${f.time}.`,
      ],
      limitation: "Hindi ibig sabihin ng tugmang pangangailangan na tatanggapin ng mamimili ang huli.",
    }),
    processing: (f) => ({
      why: "Wala pang tugmang pangangailangan ng mamimili, at may nakalistang posibleng pagpapalaki ng halaga para sa isdang ito.",
      reasons: [
        "Walang bukas na pangangailangan ng mamimili na tugma sa huling ito ngayon.",
        "May nakalistang posibleng pagpapalaki ng halaga para sa isdang ito.",
        `Natitirang oras: ${f.time}.`,
      ],
      limitation: "Posibilidad lang ito na dapat suriin, hindi pahintulot na iproseso. Tingnan muna ang mga kondisyon.",
    }),
    no_matches_share: (f) => ({
      why: "Wala pang tugmang pangangailangan ng mamimili at paubos na ang oras, kaya ang pagbabahagi ang mungkahi.",
      reasons: ["Walang bukas na pangangailangan ng mamimili na tugma sa huling ito ngayon.", `Natitirang oras: ${f.time}.`],
      limitation: "Ang mga bukas na pangangailangan ng mamimili sa LAMBAT ngayon lang ang sakop ng paghahanap.",
    }),
    time_available: (f) => ({
      why: "May oras pa para maghanap ng mamimili.",
      reasons: [`Natitirang oras: ${f.time}.`, "Walang bukas na pangangailangan ng mamimili na tugma sa huling ito ngayon."],
      limitation: "Maaaring lumitaw ang mga bagong pangangailangan ng mamimili, at hindi garantiya ng tantiya ang pagkabenta.",
    }),
  },
};

const NOT_CERTIFICATION: Record<Lang, string> = {
  en: "The spoilage estimate is not a food-safety certification.",
  fil: "Ang tantiya ng pagkasira ay hindi sertipikasyon ng kaligtasan ng pagkain.",
};

/* ---------- 3. THE FACTS the AI is given (all numbers and times are finished words) ---------- */
export type NextActionContext = {
  task: "explain_next_action";
  language: Lang;
  catch: { id: string; species: string; quantityKg: number; status: "active"; iceCondition: string };
  assessment: { riskLevel: string; remainingText: string; status: "current" } | null;
  buyerSearch: { status: "completed"; coverage: string; matchCount: number; sameBarangayCount: number };
  recommendation: {
    recommendedAction: ActionCode;
    recommendationReasons: string[];
    supportingEvidence: string[];
    limitations: string[];
  };
  allowedNextActions: ActionCode[];
};

export type NextActionResult = {
  action: ActionCode;
  title: string;
  why: string;
  reasons: string[];
  limitation: string;
  supported: boolean; // false = the card asks for a review and shows no action button
  source: "ai" | "template";
  reminder: string;
  allowedNextActions: ActionCode[];
};

export function buildNextAction(i: {
  id: string;
  species: string;
  localNames: string[];
  kilos: number;
  a: Assessment;
  decision: Decision;
  matchCount: number;
  sameBarangayCount: number;
  lang: Lang;
}): { ctx: NextActionContext; base: NextActionResult } {
  const { a, decision, lang } = i;
  const time = duration(a.minsMin ?? 0, lang);
  const level = ICE[lang][a.iceLevel ?? "none"] ?? "";
  const words = COPY[lang][decision.rule]({ time, n: i.matchCount, level });
  const supported = decision.rule !== "no_data" && decision.rule !== "time_up";

  const ctx: NextActionContext = {
    task: "explain_next_action",
    language: lang,
    catch: {
      id: i.id,
      species: i.localNames[0] ?? i.species, // the name the fisher sees on the catch card
      quantityKg: i.kilos,
      status: "active",
      iceCondition: a.iceLevel ?? "unknown",
    },
    assessment: a.risk ? { riskLevel: a.risk, remainingText: time, status: "current" } : null,
    // there is no distance in LAMBAT's buyer search: it lists open buyer needs for the same species or local name
    buyerSearch: {
      status: "completed",
      coverage: "Open buyer needs in LAMBAT for the same species or local name",
      matchCount: i.matchCount,
      sameBarangayCount: i.sameBarangayCount,
    },
    recommendation: {
      recommendedAction: decision.action,
      recommendationReasons: words.reasons,
      supportingEvidence: [
        ...(a.risk ? [`Risk level: ${a.risk}`] : []),
        `Time left: ${time}`,
        `Open buyer needs matching this catch: ${i.matchCount}`,
        `Of these, in the same barangay: ${i.sameBarangayCount}`,
      ],
      limitations: [words.limitation, NOT_CERTIFICATION[lang]],
    },
    allowedNextActions: decision.allowed,
  };

  const base: NextActionResult = {
    action: decision.action,
    title: TITLE[lang][decision.action],
    why: words.why,
    reasons: words.reasons.slice(0, 3),
    limitation: words.limitation,
    supported,
    source: "template",
    reminder: REMINDER[lang],
    allowedNextActions: decision.allowed,
  };
  return { ctx, base };
}

/* ---------- 4. THE AI writes the words; the template is the safety net ---------- */
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
// the buyer search has no radius, so any distance the AI mentions is made up
const INVENTED = /\b(km|kilometers?|kilometres?|kilometro|radius|radyus)\b/i;

// the same answer is reused for 5 minutes, so reopening the page does not call the AI again
const cache = new Map<string, { at: number; value: NextActionResult }>();
const TTL_MS = 5 * 60_000;

export function nextActionCacheKey(ctx: NextActionContext): string {
  // only things that change the explanation: the action, the counts, the risk, and the time left in whole hours
  // ("3 hours 20 minutes" -> "3 hours", "45 minutes" -> "45 minutes")
  const left = (ctx.assessment?.remainingText ?? "").split(" ").slice(0, 2).join(" ");
  return [ctx.catch.id, ctx.language, ctx.recommendation.recommendedAction, ctx.assessment?.riskLevel, ctx.catch.iceCondition, ctx.buyerSearch.matchCount, left].join("|");
}

export async function explainNextAction(ctx: NextActionContext, base: NextActionResult): Promise<NextActionResult> {
  const key = nextActionCacheKey(ctx);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  // the card loads by itself, so wait at most 8 seconds before showing the plain version
  const raw = await chatJson(`${NEXT_ACTION_RULES}\n\n${NEXT_ACTION_FORMAT}`, JSON.stringify(ctx), 8_000);
  const obj = extractJson(raw);
  if (!obj) return base;

  const why = str(obj.why);
  const limitation = str(obj.limitation);
  const reasons = (Array.isArray(obj.reasons) ? obj.reasons : []).map(str).filter(Boolean).slice(0, 3);
  const all = [why, ...reasons, limitation].join(" ");
  if (!why || !limitation || wordCount(all) > 130 || INVENTED.test(all) || !numbersAreGrounded(all, ctx)) {
    console.error("Next-action explanation rejected (empty, too long, a distance, or a number we did not give it)");
    return base;
  }

  // the action, title and "supported" always come from the rules, never from the AI
  const value: NextActionResult = { ...base, why, reasons: reasons.length ? reasons : base.reasons, limitation, source: "ai" };
  if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}