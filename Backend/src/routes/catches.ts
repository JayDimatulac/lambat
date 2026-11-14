import { rateLimit } from "express-rate-limit";
import { explain } from "../lib/llm";
import { buildNextAction, decideNextAction, explainNextAction } from "../lib/nextAction";
import { buildExplainContext } from "../lib/explainContext";
import { Router } from "express";
import type { CatchStatus, RiskLevel } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { assess } from "../lib/engine";
import {
  askGuide, buildProcessingContext, checkSuitability, explainGuide, stepText,
  suitabilityMessage, DISCLAIMER, type GuideIntro, type ProcessingReference,
} from "../lib/processingGuide";

export const catchesRouter = Router();

const OUTCOMES: CatchStatus[] = ["SOLD", "REDISTRIBUTED", "PROCESSED", "DISCARDED"];
const ALL_STATUSES: CatchStatus[] = ["ACTIVE", ...OUTCOMES];

const speciesSelect = {
  id: true,
  code: true,
  englishName: true,
  scientificName: true,
  localNames: true,
  l0Min: true,
  l0Max: true,
  histamine: true,
};

const catchInclude = {
  species: { select: speciesSelect },
  iceEvents: { select: { at: true, iceKg: true }, orderBy: { at: "asc" as const } },
};

type CatchRow = {
  status: CatchStatus;
  caughtAt: Date;
  kilos: number;
  iceEvents: { at: Date; iceKg: number }[];
  species: { l0Min: number | null; l0Max: number | null; histamine: boolean };
};

function withAssessment<T extends CatchRow>(c: T) {
  return {
    ...c,
    assessment: c.status === "ACTIVE" ? assess(c, c.iceEvents, c.species) : null,
  };
}

// Log a new catch (fisherfolk only). iceKg is the total ice on the fish at the time of the catch.
catchesRouter.post("/", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { speciesId, kilos, iceKg, place, caughtAt } = req.body ?? {};

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") {
    res.status(403).json({ error: "Account not active" });
    return;
  }

  if (typeof speciesId !== "string") {
    res.status(400).json({ error: "Choose a species" });
    return;
  }
  const species = await prisma.species.findUnique({ where: { id: speciesId } });
  if (!species) {
    res.status(400).json({ error: "Unknown species" });
    return;
  }

  if (typeof kilos !== "number" || !(kilos > 0) || kilos > 100000) {
    res.status(400).json({ error: "Enter the kilos caught" });
    return;
  }

  let ice = 0;
  if (iceKg !== undefined && iceKg !== null) {
    if (typeof iceKg !== "number" || iceKg < 0 || iceKg > 100000) {
      res.status(400).json({ error: "Ice must be 0 or more" });
      return;
    }
    ice = iceKg;
  }

  let placeText: string | null = null;
  if (place !== undefined && place !== null) {
    if (typeof place !== "string" || place.length > 80) {
      res.status(400).json({ error: "Place must be 80 characters or less" });
      return;
    }
    placeText = place.trim() || null;
  }

  const when = caughtAt === undefined || caughtAt === null ? new Date() : new Date(caughtAt);
  const now = Date.now();
  if (Number.isNaN(when.getTime())) {
    res.status(400).json({ error: "Invalid catch time" });
    return;
  }
  if (when.getTime() > now + 5 * 60 * 1000) {
    res.status(400).json({ error: "Catch time can't be in the future" });
    return;
  }
  if (when.getTime() < now - 30 * 24 * 60 * 60 * 1000) {
    res.status(400).json({ error: "Catch time is too far in the past" });
    return;
  }

  const created = await prisma.catchBatch.create({
    data: {
      userId,
      speciesId,
      kilos,
      place: placeText,
      caughtAt: when,
      iceEvents: { create: [{ at: when, iceKg: ice }] },
    },
    include: catchInclude,
  });

  res.status(201).json(withAssessment(created));
});

// List my catches (optional ?status=ACTIVE)
catchesRouter.get("/", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };

  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !ALL_STATUSES.includes(status as CatchStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }

  const catches = await prisma.catchBatch.findMany({
    where: { userId, ...(status ? { status: status as CatchStatus } : {}) },
    orderBy: { caughtAt: "desc" },
    include: catchInclude,
  });

  res.json(catches.map(withAssessment));
});

// One catch (the owner, or an admin)
catchesRouter.get("/:id", requireAuth, async (req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };

  const found = await prisma.catchBatch.findUnique({
    where: { id: String(req.params.id) },
    include: catchInclude,
  });

  if (!found || (role !== "ADMIN" && found.userId !== userId)) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }

  res.json(withAssessment(found));
});

// Add ice later: kg is the extra ice, the new total is the last total plus kg
catchesRouter.post("/:id/ice", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { kg } = req.body ?? {};

  if (typeof kg !== "number" || !(kg > 0) || kg > 10000) {
    res.status(400).json({ error: "Enter how many kilos of ice you added" });
    return;
  }

  const found = await prisma.catchBatch.findUnique({
    where: { id: String(req.params.id) },
    include: catchInclude,
  });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (found.status !== "ACTIVE") {
    res.status(409).json({ error: "This catch already has an outcome" });
    return;
  }

  const lastTotal = found.iceEvents.length ? found.iceEvents[found.iceEvents.length - 1].iceKg : 0;
  await prisma.iceEvent.create({
    data: { catchId: found.id, at: new Date(), iceKg: lastTotal + kg },
  });

  const updated = await prisma.catchBatch.findUnique({ where: { id: found.id }, include: catchInclude });
  res.json(withAssessment(updated!));
});

// Mark what happened to a catch: SOLD, REDISTRIBUTED, PROCESSED or DISCARDED
catchesRouter.patch("/:id/outcome", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { status } = req.body ?? {};

  if (!OUTCOMES.includes(status)) {
    res.status(400).json({ error: "Status must be SOLD, REDISTRIBUTED, PROCESSED or DISCARDED" });
    return;
  }

  const found = await prisma.catchBatch.findUnique({
    where: { id: String(req.params.id) },
    include: catchInclude,
  });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (found.status !== "ACTIVE") {
    res.status(409).json({ error: "This catch already has an outcome" });
    return;
  }

  // remember how risky it was at the moment it was closed
  const a = assess(found, found.iceEvents, found.species);
  const updated = await prisma.catchBatch.update({
    where: { id: found.id },
    data: { status, closedAt: new Date(), closedRisk: a.risk },
    include: catchInclude,
  });

  res.json(withAssessment(updated));
});

// Undo an outcome (not possible once an order exists for the catch)
catchesRouter.patch("/:id/reopen", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };

  const found = await prisma.catchBatch.findUnique({ where: { id: String(req.params.id) } });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (found.status === "ACTIVE") {
    res.status(409).json({ error: "This catch is already active" });
    return;
  }
  const order = await prisma.order.findFirst({
    where: { catchId: found.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
  });
  if (order) {
    res.status(409).json({ error: "This catch has an order, so it can't be reopened" });
    return;
  }

  const updated = await prisma.catchBatch.update({
    where: { id: found.id },
    data: { status: "ACTIVE", closedAt: null, closedRisk: null },
    include: catchInclude,
  });
  res.json(withAssessment(updated));
});

// Potential value-added pathways for one of my active catches
catchesRouter.get("/:id/pathways", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };

  const found = await prisma.catchBatch.findUnique({
    where: { id: String(req.params.id) },
    include: catchInclude,
  });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }

  const disclaimer =
    "These are potential value-added pathways for decision support only. This is not a food-safety certification.";

  if (found.status !== "ACTIVE") {
    res.json({ risk: null, pathways: [], note: "This catch already has an outcome.", disclaimer });
    return;
  }

  const a = assess(found, found.iceEvents, found.species);

  if (!a.risk) {
    res.json({
      risk: null,
      pathways: [],
      note: "Not enough shelf-life data to suggest a pathway yet.",
      disclaimer,
      placeholder: a.placeholder,
    });
    return;
  }
  // the safety rule lives here, not in the data: no pathway when time is short
  if (a.risk === "high" || a.risk === "critical") {
    res.json({
      risk: a.risk,
      pathways: [],
      note: "No processing pathway is suggested for a high-risk catch.",
      disclaimer,
      placeholder: a.placeholder,
    });
    return;
  }

  const level: RiskLevel = a.risk === "low" ? "LOW" : "MEDIUM";
  const pathways = await prisma.pathway.findMany({
    where: { speciesId: found.speciesId, active: true, allowedRisks: { has: level } },
    select: {
      id: true,
      name: true,
      requiredConditions: true,
      avoidConditions: true,
      recommendation: true,
      source: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({
    risk: a.risk,
    label: "Potential value-added pathway",
    pathways,
    disclaimer,
    placeholder: a.placeholder,
  });
});

// 20 questions per hour per person, so the AI bill can't run away
const explainLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (_req, res) => (res.locals.auth as { userId: string }).userId,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many questions for now. Please try again later." },
});

// "Bakit ganito?": explain one of my active catches in plain words
catchesRouter.post(
  "/:id/explain",
  requireAuth,
  requireRole("FISHERFOLK"),
  explainLimiter,
  async (req, res) => {
    const { userId } = res.locals.auth as { userId: string };
    const lang = req.body?.lang === "fil" ? "fil" : "en";

    const found = await prisma.catchBatch.findUnique({
      where: { id: String(req.params.id) },
      include: catchInclude,
    });
    if (!found || found.userId !== userId) {
      res.status(404).json({ error: "Catch not found" });
      return;
    }
    if (found.status !== "ACTIVE") {
      res.status(409).json({ error: "This catch already has an outcome" });
      return;
    }

    // the backend works out every fact; the AI only gets to explain them
    const a = assess(found, found.iceEvents, found.species);
    const ctx = buildExplainContext({
      id: found.id,
      species: found.species.englishName,
      localNames: found.species.localNames,
      histamine: found.species.histamine,
      kilos: found.kilos,
      place: found.place,
      caughtAt: found.caughtAt,
      iceEventCount: found.iceEvents.length,
      a,
      lang,
    });
    if (!ctx) {
      res.status(409).json({ error: "Not enough shelf-life data for this species yet", unavailable: true });
      return;
    }

    const out = await explain(ctx);

    res.json({
      ...out,
      lang,
      assessment: a,
      disclaimer: "This explanation is for decision support only. AI can make mistakes.",
    });
  }
);

// ---------- Value-Added Processing Guide ----------
const processingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (_req, res) => (res.locals.auth as { userId: string }).userId,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many questions for now. Please try again later." },
});

const introCache = new Map<string, { at: number; value: GuideIntro }>();
const INTRO_TTL = 60 * 60 * 1000;

// loads the catch + verified reference + suitability; shared by the GET and the ask route
async function loadProcessing(userId: string, catchId: string, product: string) {
  const found = await prisma.catchBatch.findUnique({ where: { id: catchId }, include: catchInclude });
if (!found || found.userId !== userId) return { ok: false as const, status: 404 as const };
if (found.status !== "ACTIVE") return { ok: false as const, status: 409 as const };

  const a = assess(found, found.iceEvents, found.species);
  const row = await prisma.processingGuide.findFirst({
    where: { speciesId: found.speciesId, active: true, product: { equals: product, mode: "insensitive" } },
  });
  const ref: ProcessingReference | null = row
    ? {
        id: row.id,
        product: row.product,
        description: row.description,
        requiresIce: row.requiresIce,
        allowedRisks: row.allowedRisks.filter((r): r is "LOW" | "MEDIUM" => r !== "HIGH"),
        equipment: row.equipment,
        ingredients: row.ingredients,
        preparation: row.preparation,
        steps: Array.isArray(row.steps) ? (row.steps as { en: string; fil?: string }[]) : [],
        safety: row.safety,
        source: { title: row.sourceTitle, issuer: row.sourceIssuer, version: row.sourceVersion, url: row.sourceUrl },
        verified: row.verified,
      }
    : null;
    return { ok: true as const, found, a, ref, suitability: checkSuitability(a, ref) };
}

// View Process: suitability + verified guide (straight from the knowledge base) + AI intro
catchesRouter.get("/:id/processing", requireAuth, requireRole("FISHERFOLK"), processingLimiter, async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const lang = req.query.lang === "fil" ? "fil" : "en";
  const product = String(req.query.product ?? "").trim().slice(0, 80);
  if (!product) {
    res.status(400).json({ error: "product is required" });
    return;
  }

  const r = await loadProcessing(userId, String(req.params.id), product);
if (!r.ok) {
    res.status(r.status).json({ error: r.status === 404 ? "Catch not found" : "This catch already has an outcome" });
    return;
  }
  const { found, a, ref, suitability } = r;
  const base = { product, suitability, message: suitabilityMessage(suitability, lang), disclaimer: DISCLAIMER[lang] };

  // not suitable or not verified: no steps, no AI call
  if (suitability.status !== "SUITABLE" || !ref) {
    res.json({ ...base, guide: null, ai: null });
    return;
  }

  const pathway = await prisma.pathway.findFirst({
    where: { speciesId: found.speciesId, active: true, name: { equals: product, mode: "insensitive" } },
    select: { recommendation: true },
  });
  const ctx = buildProcessingContext({
    lang,
    species: found.species.englishName,
    kilos: found.kilos,
    a,
    ref,
    recommendation: pathway?.recommendation ?? null,
  });

  const cacheKey = `${found.id}:${ref.id}:${lang}:${a.risk}`;
  let hit = introCache.get(cacheKey);
  if (!hit || Date.now() - hit.at > INTRO_TTL) {
    const value = await explainGuide(ctx);
    hit = { at: Date.now(), value };
    // only remember real AI answers, so a busy moment is not stuck for an hour
    if (value.source === "ai") introCache.set(cacheKey, hit);
  }

  res.json({
    ...base,
    guide: {
      product: ref.product,
      equipment: ref.equipment,
      ingredients: ref.ingredients,
      preparation: ref.preparation,
      steps: ref.steps.map((s) => stepText(s, lang)), // straight from the knowledge base, never from the AI
      safety: ref.safety,
      source: ref.source,
    },
    ai: hit.value,
  });
});

// Follow-up question about a guide: answered only from the verified reference
catchesRouter.post("/:id/processing/ask", requireAuth, requireRole("FISHERFOLK"), processingLimiter, async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const lang = req.body?.lang === "fil" ? "fil" : "en";
  const product = String(req.body?.product ?? "").trim().slice(0, 80);
  const question = String(req.body?.question ?? "").trim();
  if (!product || question.length < 3) {
    res.status(400).json({ error: "product and question are required" });
    return;
  }

  const r = await loadProcessing(userId, String(req.params.id), product);
  if (!r.ok) {
    res.status(r.status).json({ error: r.status === 404 ? "Catch not found" : "This catch already has an outcome" });
    return;
  }
  const { found, a, ref, suitability } = r;
  if (suitability.status !== "SUITABLE" || !ref) {
    res.status(409).json({ error: suitabilityMessage(suitability, lang), suitability });
    return;
  }

  const ctx = buildProcessingContext({
    lang,
    species: found.species.englishName,
    kilos: found.kilos,
    a,
    ref,
    recommendation: null,
  });
  const out = await askGuide(ctx, question);
  res.json({ ...out, disclaimer: DISCLAIMER[lang] });
});
// 60 per hour per person: the card loads by itself, but one answer is reused for 5 minutes
const nextActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  keyGenerator: (_req, res) => (res.locals.auth as { userId: string }).userId,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests for now. Please try again later." },
});

// "LAMBAT suggests": the rules choose the next action, the AI only explains it
catchesRouter.post(
  "/:id/next-action",
  requireAuth,
  requireRole("FISHERFOLK"),
  nextActionLimiter,
  async (req, res) => {
    const { userId } = res.locals.auth as { userId: string };
    const lang = req.body?.lang === "fil" ? "fil" : "en";

    const found = await prisma.catchBatch.findUnique({
      where: { id: String(req.params.id) },
      include: catchInclude,
    });
    if (!found || found.userId !== userId) {
      res.status(404).json({ error: "Catch not found" });
      return;
    }
    if (found.status !== "ACTIVE") {
      res.status(409).json({ error: "This catch already has an outcome" });
      return;
    }
    // a catch with a confirmed or completed order has nothing left to suggest
    const hasOrder = await prisma.order.findFirst({
      where: { catchId: found.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
    });
    if (hasOrder) {
      res.status(409).json({ error: "This catch already has an order" });
      return;
    }

    const a = assess(found, found.iceEvents, found.species);

    // buyer search: the same rule as GET /needs/matches (open needs, same species or same local name)
    const me = await prisma.user.findUnique({ where: { id: userId } });
    const myArea = (me?.barangay ?? "").toLowerCase();
    const needs = await prisma.buyerNeed.findMany({
      where: {
        status: "OPEN",
        buyer: { status: "ACTIVE" },
        OR: [{ speciesId: found.speciesId }, { species: { localNames: { hasSome: found.species.localNames } } }],
      },
      select: { barangay: true, buyer: { select: { barangay: true } } },
    });
    const sameBarangayCount = myArea
      ? needs.filter((n) => n.barangay.toLowerCase() === myArea || n.buyer.barangay.toLowerCase() === myArea).length
      : 0;

    // processing is only possible when the pathways table lists this species for this risk (same rule as /pathways)
    const level: RiskLevel | null = a.risk === "low" ? "LOW" : a.risk === "moderate" ? "MEDIUM" : null;
    const pathwayCount = level
      ? await prisma.pathway.count({ where: { speciesId: found.speciesId, active: true, allowedRisks: { has: level } } })
      : 0;

    const decision = decideNextAction({ a, matchCount: needs.length, pathwayEligible: pathwayCount > 0 });
    const { ctx, base } = buildNextAction({
      id: found.id,
      species: found.species.englishName,
      localNames: found.species.localNames,
      kilos: found.kilos,
      a,
      decision,
      matchCount: needs.length,
      sameBarangayCount,
      lang,
    });

    res.json(await explainNextAction(ctx, base));
  }
);