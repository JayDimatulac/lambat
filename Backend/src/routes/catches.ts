import { Router } from "express";
import type { CatchStatus } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const catchesRouter = Router();

const OUTCOMES: CatchStatus[] = ["SOLD", "REDISTRIBUTED", "PROCESSED", "DISCARDED"];
const ALL_STATUSES: CatchStatus[] = ["ACTIVE", ...OUTCOMES];

const speciesSelect = {
  id: true,
  englishName: true,
  scientificName: true,
  localNames: true,
  shelfLifeHoursAt0C: true,
};

// Log a new catch (fisherfolk only)
catchesRouter.post("/", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { speciesId, kilos, iceSacks, caughtAt } = req.body ?? {};

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

  let ice: number | null = null;
  if (iceSacks !== undefined && iceSacks !== null) {
    if (typeof iceSacks !== "number" || iceSacks < 0 || iceSacks > 1000) {
      res.status(400).json({ error: "Ice must be 0 or more" });
      return;
    }
    ice = iceSacks;
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
    data: { userId, speciesId, kilos, iceSacks: ice, caughtAt: when },
    include: { species: { select: speciesSelect } },
  });

  res.status(201).json(created);
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
    include: { species: { select: speciesSelect } },
  });

  res.json(catches);
});

// One catch (the owner, or an admin)
catchesRouter.get("/:id", requireAuth, async (req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };

  const found = await prisma.catchBatch.findUnique({
    where: { id: String(req.params.id) },
    include: { species: { select: speciesSelect } },
  });

  if (!found || (role !== "ADMIN" && found.userId !== userId)) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }

  res.json(found);
});

// Mark what happened to a catch: SOLD, REDISTRIBUTED, PROCESSED or DISCARDED
catchesRouter.patch("/:id/outcome", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { status } = req.body ?? {};

  if (!OUTCOMES.includes(status)) {
    res.status(400).json({ error: "Status must be SOLD, REDISTRIBUTED, PROCESSED or DISCARDED" });
    return;
  }

  const found = await prisma.catchBatch.findUnique({ where: { id: String(req.params.id) } });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (found.status !== "ACTIVE") {
    res.status(409).json({ error: "This catch already has an outcome" });
    return;
  }

  const updated = await prisma.catchBatch.update({
    where: { id: found.id },
    data: { status },
    include: { species: { select: speciesSelect } },
  });

  res.json(updated);
});