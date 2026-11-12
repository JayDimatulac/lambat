import type { Assessment } from "./engine";
import type { IceLevel } from "../config/shelfLife";

export type Lang = "en" | "fil";

export const REMINDER: Record<Lang, string> = {
  en: "This is an AI-assisted estimate, not a food-safety certification.",
  fil: "Ito ay tantiyang tinulungan ng AI, hindi sertipikasyon ng kaligtasan ng pagkain.",
};

export const RISK_LABEL: Record<Lang, Record<string, string>> = {
  en: { low: "low", moderate: "moderate", high: "high", critical: "critical" },
  fil: { low: "mababa", moderate: "katamtaman", high: "mataas", critical: "kritikal" },
};

export const ACTION_LABEL: Record<Lang, Record<string, string>> = {
  en: {
    "Find Buyers": "find buyers",
    "Share Catch": "share your catch",
    "Add Ice": "add ice",
    "Explore Value-Added Pathways": "look at potential value-added pathways",
  },
  fil: {
    "Find Buyers": "humanap ng mamimili",
    "Share Catch": "ibahagi ang huli mo",
    "Add Ice": "magdagdag ng yelo",
    "Explore Value-Added Pathways": "tingnan ang mga posibleng pagpapalaki ng halaga",
  },
};

const TEXT = {
  en: {
    level: { none: "none", low: "low", fair: "fair", good: "good", plenty: "plenty" } as Record<IceLevel, string>,
    time: (t: string) => `It has been about ${t} since the catch was recorded.`,
    species: (n: string) => `Each kind of fish keeps for a different length of time, so the estimate uses the shelf-life data for ${n}.`,
    careful: (n: string) => `${n} is handled with extra caution, so the shorter, more careful time is used.`,
    ice: (l: string) => `The ice on your catch is compared with its weight. The ice level right now is "${l}".`,
    noIce: "No ice was recorded for this catch, so the estimate assumes it is not iced.",
    iceAdded: "Ice you added after the catch was counted from the time you added it.",
    noTemp: "Storage temperature was not recorded, so the estimate uses the amount of ice instead.",
    selfReported: "The amount of ice is what you reported. It was not measured.",
  },
  fil: {
    level: { none: "walang yelo", low: "kaunti", fair: "katamtaman", good: "sapat", plenty: "marami" } as Record<IceLevel, string>,
    time: (t: string) => `Humigit-kumulang ${t} na ang lumipas mula nang itala ang huli.`,
    species: (n: string) => `Magkakaiba ang tagal ng bawat uri ng isda, kaya ginamit ang datos sa tagal bago masira ng ${n}.`,
    careful: (n: string) => `Mas maingat ang pagtrato sa ${n}, kaya ang mas maikli at mas maingat na tantiya ng oras ang ginamit.`,
    ice: (l: string) => `Ikinukumpara ang yelo sa bigat ng huli mo. Ang yelo ngayon ay: ${l}.`,
    noIce: "Walang naitalang yelo para sa huling ito, kaya ipinagpalagay na walang yelo.",
    iceAdded: "Ang yelong idinagdag mo pagkatapos ng huli ay binilang mula sa oras ng pagdagdag.",
    noTemp: "Hindi naitala ang temperatura ng imbakan, kaya ang dami ng yelo ang ginamit sa halip.",
    selfReported: "Ang dami ng yelo ay ayon sa iniulat mo at hindi sinukat.",
  },
};

export type ExplainContext = {
  feature: "catch_explainability";
  language: Lang;
  catch: {
    id: string;
    species: string;
    localNames: string[];
    quantityKg: number;
    caughtAtText: string;
    location: string | null;
    iceCondition: string;
  };
  assessment: {
    riskLevel: string;
    remainingMinutes: number;
    remainingText: string;
    sellByText: string;
    assessedAtText: string;
    sinceCatchText: string;
    supportingFactors: { factor: string; explanation: string }[];
    missingInformation: string[];
  };
  allowedNextActions: string[];
};

// 409 minutes -> "6 hours 49 minutes". The AI is given finished words so it never converts time itself.
function duration(totalMins: number, lang: Lang): string {
  const mins = Math.max(0, Math.round(totalMins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hw = lang === "fil" ? "oras" : h === 1 ? "hour" : "hours";
  const mw = lang === "fil" ? "minuto" : m === 1 ? "minute" : "minutes";
  if (h === 0) return `${m} ${mw}`;
  if (m === 0) return `${h} ${hw}`;
  return lang === "fil" ? `${h} ${hw} at ${m} ${mw}` : `${h} ${hw} ${m} ${mw}`;
}

// always in Philippine time, so the AI never sees a UTC time it could misread
function when(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "fil" ? "fil-PH" : "en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function buildExplainContext(i: {
  id: string;
  species: string;
  localNames: string[];
  histamine: boolean;
  kilos: number;
  place: string | null;
  caughtAt: Date;
  iceEventCount: number;
  a: Assessment;
  lang: Lang;
  now?: Date;
}): ExplainContext | null {
  const { a, lang } = i;
  // not enough data: the caller shows the "can't explain" message instead
  if (!a.risk || !a.iceLevel || a.minsMin === null || a.sellBy === null) return null;

  const s = TEXT[lang];
  const level = s.level[a.iceLevel];
  const name = i.localNames[0] ?? i.species; // the name the fisher sees on the catch card

  // every factor below is something assess() really uses, so none of them is invented
  const supportingFactors = [
    { factor: "Time since catch", explanation: s.time(duration(a.hoursElapsed * 60, lang)) },
    { factor: "Ice on the catch", explanation: a.iceLevel === "none" ? s.noIce : s.ice(level) },
    {factor: "Species",explanation: i.histamine ? `${s.species(name)} ${s.careful(name)}` : s.species(name),},
  ];
  if (i.iceEventCount > 1) supportingFactors.push({ factor: "Ice added later", explanation: s.iceAdded });

  // allowed actions follow the same safety rules as the rest of the app
  const allowedNextActions = ["Find Buyers", "Share Catch"];
  if (a.iceLevel !== "plenty") allowedNextActions.push("Add Ice");
  if (a.risk === "low" || a.risk === "moderate") allowedNextActions.push("Explore Value-Added Pathways");

  return {
    feature: "catch_explainability",
    language: lang,
    catch: {
      id: i.id,
      species: i.species,
      localNames: i.localNames,
      quantityKg: i.kilos,
      caughtAtText: when(i.caughtAt, lang),
      location: i.place ? i.place.slice(0, 80) : null, // free text typed by the user: keep it short
      iceCondition: a.iceLevel,
    },
    assessment: {
      riskLevel: a.risk,
      remainingMinutes: a.minsMin,
      remainingText: duration(a.minsMin, lang),
      sellByText: when(new Date(a.sellBy), lang),
      assessedAtText: when(i.now ?? new Date(), lang),
      sinceCatchText: duration(a.hoursElapsed * 60, lang),
      supportingFactors,
      missingInformation: [s.noTemp, s.selfReported],
    },
    allowedNextActions,
  };
}

// the fixed sentences the template needs, kept here so llm.ts stays short
export const TEMPLATE_TEXT = {
  en: {
    why: (risk: string, rem: string, by: string) =>
      `LAMBAT estimates a ${risk} spoilage risk, with about ${rem} of marketable time left (sell before ${by}). This is an estimate from your recorded catch details, not a guarantee of freshness.`,
    next: (list: string, by: string, urgent: boolean) =>
      `${urgent ? "Time is short. " : ""}Before ${by}, you can ${list}.`,
    or: " or ",
  },
  fil: {
    why: (risk: string, rem: string, by: string) =>
      `Tinataya ng LAMBAT na ${risk} ang panganib na masira. May natitirang humigit-kumulang ${rem} para ibenta ito (bago ang ${by}). Tantiya lang ito mula sa mga detalyeng naitala mo, hindi garantiya ng pagiging sariwa.`,
    next: (list: string, by: string, urgent: boolean) =>
      `${urgent ? "Kaunti na lang ang oras. " : ""}Bago ang ${by}, puwede mong ${list}.`,
    or: " o ",
  },
};