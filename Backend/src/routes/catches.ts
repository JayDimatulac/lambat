import { rateLimit } from "express-rate-limit";
import { explain } from "../lib/llm";
import { Router } from "express";
import type { CatchStatus, RiskLevel } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { assess } from "../lib/engine";

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

    const a = assess(found, found.iceEvents, found.species);
    if (!a.risk || !a.iceLevel || a.hoursMin === null || a.hoursMax === null) {
      res.status(409).json({ error: "Not enough shelf-life data for this species yet" });
      return;
    }

    const out = await explain(
      {
        species: found.species.englishName,
        localNames: found.species.localNames,
        kilos: found.kilos,
        hoursElapsed: a.hoursElapsed,
        iceLevel: a.iceLevel,
        risk: a.risk,
        hoursMin: a.hoursMin,
        hoursMax: a.hoursMax,
        histamine: found.species.histamine,
      },
      lang
    );

    res.json({
      ...out,
      lang,
      assessment: a,
      disclaimer: "This explanation is for decision support only. AI can make mistakes.",
    });
  }
);