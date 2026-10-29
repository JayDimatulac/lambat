import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const needsRouter = Router();

const speciesSelect = { id: true, englishName: true, localNames: true };

// Buyer posts what they want to buy
needsRouter.post("/", requireAuth, requireRole("BUYER"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.status !== "ACTIVE") {
    res.status(403).json({ error: "Your account is waiting for approval" });
    return;
  }

  const { speciesId, kilos, pricePerKg, neededBy, barangay, note } = req.body ?? {};

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
    res.status(400).json({ error: "Enter the kilos you need" });
    return;
  }
  let price: number | null = null;
  if (pricePerKg !== undefined && pricePerKg !== null) {
    if (typeof pricePerKg !== "number" || !(pricePerKg > 0) || pricePerKg > 100000) {
      res.status(400).json({ error: "Price per kilo must be more than 0" });
      return;
    }
    price = pricePerKg;
  }
  let by: Date | null = null;
  if (neededBy !== undefined && neededBy !== null) {
    by = new Date(neededBy);
    if (Number.isNaN(by.getTime()) || by.getTime() < Date.now()) {
      res.status(400).json({ error: "Needed-by date must be in the future" });
      return;
    }
  }
  const area = typeof barangay === "string" && barangay.trim() ? barangay.trim() : me.barangay;
  let text: string | null = null;
  if (note !== undefined && note !== null) {
    if (typeof note !== "string" || note.length > 300) {
      res.status(400).json({ error: "Note must be 300 characters or less" });
      return;
    }
    text = note.trim() || null;
  }

  const created = await prisma.buyerNeed.create({
    data: { buyerId: userId, speciesId, kilos, pricePerKg: price, neededBy: by, barangay: area, note: text },
    include: { species: { select: speciesSelect } },
  });
  res.status(201).json(created);
});

// My needs
needsRouter.get("/mine", requireAuth, requireRole("BUYER"), async (_req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const needs = await prisma.buyerNeed.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: { species: { select: speciesSelect }, _count: { select: { offers: true } } },
  });
  res.json(needs);
});

// Open needs that match one of my active catches (same species, same barangay first)
needsRouter.get("/matches", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const catchId = typeof req.query.catchId === "string" ? req.query.catchId : "";

  const found = await prisma.catchBatch.findUnique({ where: { id: catchId } });
  if (!found || found.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (found.status !== "ACTIVE") {
    res.status(409).json({ error: "This catch already has an outcome" });
    return;
  }

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const myArea = (me?.barangay ?? "").toLowerCase();

  const needs = await prisma.buyerNeed.findMany({
    where: { speciesId: found.speciesId, status: "OPEN", buyer: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    include: {
      species: { select: speciesSelect },
      buyer: { select: { id: true, businessName: true, buyerType: true, barangay: true } },
    },
  });

  const rows = needs.map((n) => ({
    ...n,
    sameBarangay:
      n.barangay.toLowerCase() === myArea || n.buyer.barangay.toLowerCase() === myArea,
  }));
  rows.sort((a, b) => Number(b.sameBarangay) - Number(a.sameBarangay));

  res.json(rows);
});

// Cancel one of my open needs
needsRouter.patch("/:id/cancel", requireAuth, requireRole("BUYER"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const found = await prisma.buyerNeed.findUnique({ where: { id: String(req.params.id) } });
  if (!found || found.buyerId !== userId) {
    res.status(404).json({ error: "Need not found" });
    return;
  }
  if (found.status !== "OPEN") {
    res.status(409).json({ error: "This need is already closed" });
    return;
  }
  const updated = await prisma.buyerNeed.update({ where: { id: found.id }, data: { status: "CANCELLED" } });
  res.json(updated);
});