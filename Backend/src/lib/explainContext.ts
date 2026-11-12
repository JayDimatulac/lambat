import type { Assessment } from "./engine";
import type { IceLevel } from "../config/shelfLife";

export type Lang = "en" | "fil";

// The app always adds this itself, so the AI can never leave it out or reword it
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

// short lines on purpose: they are shown as bullet points on a small screen
const TEXT = {
  en: {
    level: { none: "none", low: "low", fair: "fair", good: "good", plenty: "plenty" } as Record<IceLevel, string>,
    time: (t: string) => `About ${t} have passed since the catch was recorded.`,
    species: (n: string) => `The estimate uses the shelf-life data for ${n}.`,
    careful: (n: string) => `${n} needs extra care, so the shorter time is used.`,
    ice: (l: string) => `The ice level is "${l}", compared with the weight of your catch.`,
    noIce: "No ice was recorded, so the estimate assumes no ice.",
    iceAdded: "Ice you added later is counted from the time you added it.",
    noTemp: "Storage temperature was not recorded, so the amount of ice is used instead.",
    selfReported: "The amount of ice is as you reported, not measured.",
  },
  fil: {
    level: { none: "walang yelo", low: "kaunti", fair: "katamtaman", good: "sapat", plenty: "marami" } as Record<IceLevel, string>,
    time: (t: string) => `Humigit-kumulang ${t} na ang lumipas mula nang itala ang huli.`,
    species: (n: string) => `Ginamit ang datos sa tagal bago masira ng ${n}.`,
    careful: (n: string) => `Kailangan ng ${n} ng dagdag na ingat, kaya ang mas maikling oras ang ginamit.`,
    ice: (l: string) => `Yelo ngayon: ${l} (kumpara sa bigat ng huli mo).`,
    noIce: "Walang naitalang yelo, kaya ipinagpalagay na walang yelo.",
    iceAdded: "Binilang ang idinagdag mong yelo mula sa oras ng pagdagdag.",
    noTemp: "Hindi naitala ang temperatura, kaya ang dami ng yelo ang ginamit.",
    selfReported: "Ang dami ng yelo ay ayon sa iniulat mo, hindi sinukat.",
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

// 409 minutes -> "6 hours 49 minutes". The AI is given the finished words so it never converts time itself.
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
    {
      factor: "Ice on the catch",
      explanation: a.iceLevel === "none" ? s.noIce : s.ice(level),
    },
    {
      factor: "Species",
      explanation: i.histamine ? `${s.species(name)} ${s.careful(name)}` : s.species(name),
    },
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

// the fixed short lines the fallback needs, kept here so llm.ts stays short
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export const TEMPLATE_TEXT = {
  en: {
    risk: (risk: string) => `LAMBAT estimates a ${risk} spoilage risk.`,
    time: (rem: string, by: string) => `About ${rem} left to sell, before ${by}.`,
    urgent: "Time is short.",
    step: (action: string, by: string) => `${cap(action)} before ${by}.`,
  },
  fil: {
    risk: (risk: string) => `Tinataya ng LAMBAT na ${risk} ang panganib na masira.`,
    time: (rem: string, by: string) => `May natitirang humigit-kumulang ${rem} para ibenta, bago ang ${by}.`,
    urgent: "Kaunti na lang ang oras.",
    step: (action: string, by: string) => `${cap(action)} bago ang ${by}.`,
  },
};