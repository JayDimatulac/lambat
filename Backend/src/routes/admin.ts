import { Router } from "express";
import bcrypt from "bcrypt";
import type { AccountStatus, Role, RiskLevel } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { normalizeMobile } from "./auth";
import { assess } from "../lib/engine";
import type { CatchStatus, NeedStatus, OfferStatus, OrderStatus } from "@prisma/client";

export const adminRouter = Router();

// every route in this file is admin-only
adminRouter.use(requireAuth, requireRole("ADMIN"));

const ROLES: Role[] = ["FISHERFOLK", "BUYER", "ADMIN", "ORGANIZATION"];
const STATUSES: AccountStatus[] = ["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"];

// List users (optional ?role=BUYER&status=PENDING)
adminRouter.get("/users", async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  if (role && !ROLES.includes(role as Role)) {
    res.status(400).json({ error: "Unknown role" });
    return;
  }
  if (status && !STATUSES.includes(status as AccountStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as Role } : {}),
      ...(status ? { status: status as AccountStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    omit: { passwordHash: true },
  });

  res.json(users);
});

// Approve (ACTIVE) or reject/suspend (SUSPENDED) an account
// Approve (ACTIVE), reject a buyer application (REJECTED, with a note) or suspend
adminRouter.patch("/users/:id/status", async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { status, note } = req.body ?? {};
  const id = String(req.params.id);

  if (status !== "ACTIVE" && status !== "SUSPENDED" && status !== "REJECTED") {
    res.status(400).json({ error: "Status must be ACTIVE, SUSPENDED or REJECTED" });
    return;
  }
  if (id === userId) {
    res.status(400).json({ error: "You can't change your own account status" });
    return;
  }
  let reason: string | null = null;
  if (note !== undefined && note !== null) {
    if (typeof note !== "string" || note.length > 300) {
      res.status(400).json({ error: "Note must be 300 characters or less" });
      return;
    }
    reason = note.trim() || null;
  }

  const found = await prisma.user.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (status === "REJECTED" && found.role !== "BUYER") {
    res.status(400).json({ error: "Only buyer applications can be rejected" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status, statusNote: status === "ACTIVE" ? null : reason },
    omit: { passwordHash: true },
  });

  // tell the buyer about the decision on their application
  if (found.role === "BUYER" && found.status !== status && (status === "ACTIVE" || status === "REJECTED")) {
    await prisma.notification.create({
      data: {
        userId: id,
        type: "SYSTEM",
        title: status === "ACTIVE" ? "Application approved" : "Application not approved",
        body: status === "ACTIVE" ? "You can now post needs and receive offers." : reason ?? "Please check your details and apply again.",
      },
    });
  }

  res.json(updated);
});

// Create an ADMIN or ORGANIZATION account
adminRouter.post("/users", async (req, res) => {
  const { role, name, mobile, password, barangay } = req.body ?? {};

  if (role !== "ADMIN" && role !== "ORGANIZATION") {
    res.status(400).json({ error: "Role must be ADMIN or ORGANIZATION" });
    return;
  }
  const cleanMobile = normalizeMobile(mobile);
  if (!cleanMobile) {
    res.status(400).json({ error: "Enter a valid mobile number, like 09171234567" });
    return;
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Enter a name" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const taken = await prisma.user.findUnique({ where: { mobile: cleanMobile } });
  if (taken) {
    res.status(409).json({ error: "This mobile number is already registered" });
    return;
  }

  const created = await prisma.user.create({
    data: {
      role,
      status: "ACTIVE",
      name: name.trim(),
      mobile: cleanMobile,
      barangay: typeof barangay === "string" && barangay.trim() ? barangay.trim() : "N/A",
      passwordHash: await bcrypt.hash(password, 10),
    },
    omit: { passwordHash: true },
  });

  res.status(201).json(created);
});

// Counts for the admin dashboard
adminRouter.get("/stats", async (_req, res) => {
  const [users, catches] = await Promise.all([
    prisma.user.groupBy({ by: ["role", "status"], _count: true }),
    prisma.catchBatch.groupBy({ by: ["status"], _count: true }),
  ]);

  res.json({
    users: users.map((u) => ({ role: u.role, status: u.status, count: u._count })),
    catches: catches.map((c) => ({ status: c.status, count: c._count })),
  });
});
// Set a species' shelf life at 0 C (hours). Send l0Min and l0Max together, or both null to clear.
adminRouter.patch("/species/:id", async (req, res) => {
  const { l0Min, l0Max, histamine } = req.body ?? {};
  const id = String(req.params.id);

  const hours = (v: unknown): v is number => Number.isInteger(v) && (v as number) > 0 && (v as number) <= 2000;
  const clearing = l0Min === null && l0Max === null;
  if (!clearing && !(hours(l0Min) && hours(l0Max) && l0Max >= l0Min)) {
    res.status(400).json({ error: "Send l0Min and l0Max as whole hours from 1 to 2000 (max not below min), or both null" });
    return;
  }
  if (histamine !== undefined && typeof histamine !== "boolean") {
    res.status(400).json({ error: "histamine must be true or false" });
    return;
  }

  const found = await prisma.species.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "Species not found" });
    return;
  }

  const updated = await prisma.species.update({
    where: { id },
    data: { l0Min, l0Max, ...(histamine !== undefined ? { histamine } : {}) },
  });
  res.json(updated);
});
// ---- Pathways (admin) ----

const PATHWAY_RISKS: RiskLevel[] = ["LOW", "MEDIUM"];

function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

// optional text: undefined/null becomes "", too long or wrong type becomes null
function longText(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string" || v.length > max) return null;
  return v.trim();
}

function cleanRisks(v: unknown): RiskLevel[] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  if (!v.every((x) => PATHWAY_RISKS.includes(x))) return null;
  return Array.from(new Set(v)) as RiskLevel[];
}

function isDuplicate(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// List pathways, including switched-off ones (optional ?speciesId=)
adminRouter.get("/pathways", async (req, res) => {
  const speciesId = typeof req.query.speciesId === "string" ? req.query.speciesId : undefined;
  const rows = await prisma.pathway.findMany({
    where: speciesId ? { speciesId } : {},
    orderBy: [{ speciesId: "asc" }, { name: "asc" }],
    include: { species: { select: { id: true, englishName: true } } },
  });
  res.json(rows);
});

// Add a pathway
adminRouter.post("/pathways", async (req, res) => {
  const b = req.body ?? {};

  if (typeof b.speciesId !== "string" || !(await prisma.species.findUnique({ where: { id: b.speciesId } }))) {
    res.status(400).json({ error: "Choose a species" });
    return;
  }
  const name = cleanText(b.name, 80);
  if (!name) {
    res.status(400).json({ error: "Pathway name is required (up to 80 characters)" });
    return;
  }
  const risks = cleanRisks(b.allowedRisks);
  if (!risks) {
    res.status(400).json({ error: "Allowed risks must be LOW and/or MEDIUM. A pathway can't allow HIGH." });
    return;
  }
  const required = longText(b.requiredConditions, 500);
  const avoid = longText(b.avoidConditions, 500);
  const recommendation = cleanText(b.recommendation, 1000);
  if (required === null || avoid === null) {
    res.status(400).json({ error: "Conditions must be text of 500 characters or less" });
    return;
  }
  if (!recommendation) {
    res.status(400).json({ error: "Recommendation is required (up to 1000 characters)" });
    return;
  }
  const source = b.source === undefined || b.source === null ? null : cleanText(b.source, 300);
  if (b.source !== undefined && b.source !== null && !source) {
    res.status(400).json({ error: "Source must be text of 300 characters or less" });
    return;
  }

  try {
    const created = await prisma.pathway.create({
      data: {
        speciesId: b.speciesId,
        name,
        allowedRisks: risks,
        requiredConditions: required,
        avoidConditions: avoid,
        recommendation,
        source,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    if (isDuplicate(e)) {
      res.status(409).json({ error: "This species already has a pathway with that name" });
      return;
    }
    throw e;
  }
});

// Edit a pathway, or switch it off/on with { "active": false }
adminRouter.patch("/pathways/:id", async (req, res) => {
  const id = String(req.params.id);
  const found = await prisma.pathway.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "Pathway not found" });
    return;
  }

  const b = req.body ?? {};
  const data: Record<string, unknown> = {};

  if (b.name !== undefined) {
    const v = cleanText(b.name, 80);
    if (!v) { res.status(400).json({ error: "Pathway name is required (up to 80 characters)" }); return; }
    data.name = v;
  }
  if (b.allowedRisks !== undefined) {
    const v = cleanRisks(b.allowedRisks);
    if (!v) { res.status(400).json({ error: "Allowed risks must be LOW and/or MEDIUM" }); return; }
    data.allowedRisks = v;
  }
  if (b.requiredConditions !== undefined) {
    const v = longText(b.requiredConditions, 500);
    if (v === null) { res.status(400).json({ error: "Conditions must be 500 characters or less" }); return; }
    data.requiredConditions = v;
  }
  if (b.avoidConditions !== undefined) {
    const v = longText(b.avoidConditions, 500);
    if (v === null) { res.status(400).json({ error: "Conditions must be 500 characters or less" }); return; }
    data.avoidConditions = v;
  }
  if (b.recommendation !== undefined) {
    const v = cleanText(b.recommendation, 1000);
    if (!v) { res.status(400).json({ error: "Recommendation is required (up to 1000 characters)" }); return; }
    data.recommendation = v;
  }
  if (b.source !== undefined) {
    if (b.source === null) data.source = null;
    else {
      const v = cleanText(b.source, 300);
      if (!v) { res.status(400).json({ error: "Source must be 300 characters or less" }); return; }
      data.source = v;
    }
  }
  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") { res.status(400).json({ error: "Active must be true or false" }); return; }
    data.active = b.active;
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Nothing to change" });
    return;
  }

  try {
    res.json(await prisma.pathway.update({ where: { id }, data }));
  } catch (e) {
    if (isDuplicate(e)) {
      res.status(409).json({ error: "This species already has a pathway with that name" });
      return;
    }
    throw e;
  }
});
// Reset a forgotten password (SMS is not available yet, so the admin tells the person the new one).
// Admin accounts are reset with the create-admin script, never through the API.
adminRouter.patch("/users/:id/password", async (req, res) => {
  const { password } = req.body ?? {};
  const id = String(req.params.id);

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    res.status(400).json({ error: "The password must be 8 to 72 characters" });
    return;
  }
  const found = await prisma.user.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (found.role === "ADMIN") {
    res.status(403).json({ error: "Admin passwords are reset with the create-admin script" });
    return;
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: new Date() },
  });
  res.json({ ok: true });
});
// ---- Moderation views (admin only; the whole router already requires an admin) ----

function limitOf(v: unknown): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 200) : 100;
}

const CATCH_STATUSES: CatchStatus[] = ["ACTIVE", "SOLD", "REDISTRIBUTED", "PROCESSED", "DISCARDED"];
const NEED_STATUSES: NeedStatus[] = ["OPEN", "FULFILLED", "CANCELLED"];
const OFFER_STATUSES: OfferStatus[] = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"];
const ORDER_STATUSES: OrderStatus[] = ["CONFIRMED", "COMPLETED", "CANCELLED"];

// who a row belongs to, with the contact details an admin needs when checking a complaint
const who = { select: { id: true, name: true, mobile: true, barangay: true, businessName: true } };

// All catches (optional ?status=, ?userId=, ?limit=), newest first
adminRouter.get("/catches", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  if (status && !CATCH_STATUSES.includes(status as CatchStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }

  const rows = await prisma.catchBatch.findMany({
    where: { ...(status ? { status: status as CatchStatus } : {}), ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "desc" },
    take: limitOf(req.query.limit),
    include: {
      user: who,
      species: { select: { id: true, code: true, englishName: true, l0Min: true, l0Max: true, histamine: true } },
      iceEvents: { select: { at: true, iceKg: true }, orderBy: { at: "asc" } },
    },
  });

  res.json(
    rows.map((c) => ({
      ...c,
      assessment: c.status === "ACTIVE" ? assess(c, c.iceEvents, c.species) : null,
    }))
  );
});

// All buyer needs (optional ?status=OPEN)
adminRouter.get("/needs", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !NEED_STATUSES.includes(status as NeedStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }
  const rows = await prisma.buyerNeed.findMany({
    where: status ? { status: status as NeedStatus } : {},
    orderBy: { createdAt: "desc" },
    take: limitOf(req.query.limit),
    include: {
      buyer: who,
      species: { select: { id: true, englishName: true } },
      _count: { select: { offers: true } },
    },
  });
  res.json(rows);
});

// All offers (optional ?status=PENDING)
adminRouter.get("/offers", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !OFFER_STATUSES.includes(status as OfferStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }
  const rows = await prisma.offer.findMany({
    where: status ? { status: status as OfferStatus } : {},
    orderBy: { createdAt: "desc" },
    take: limitOf(req.query.limit),
    include: {
      fisher: who,
      buyer: who,
      catch: { select: { id: true, kilos: true, status: true, species: { select: { englishName: true } } } },
    },
  });
  res.json(rows);
});

// All orders (optional ?status=CONFIRMED)
adminRouter.get("/orders", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !ORDER_STATUSES.includes(status as OrderStatus)) {
    res.status(400).json({ error: "Unknown status" });
    return;
  }
  const rows = await prisma.order.findMany({
    where: status ? { status: status as OrderStatus } : {},
    orderBy: { createdAt: "desc" },
    take: limitOf(req.query.limit),
    include: {
      fisher: who,
      buyer: who,
      catch: { select: { id: true, kilos: true, status: true, species: { select: { englishName: true } } } },
    },
  });
  res.json(rows);
});

// Take down an open need (a fake or abusive request). The buyer is told, and offers still waiting on it close.
adminRouter.patch("/needs/:id/cancel", async (req, res) => {
  const id = String(req.params.id);
  const { note } = req.body ?? {};

  let reason: string | null = null;
  if (note !== undefined && note !== null) {
    if (typeof note !== "string" || note.length > 300) {
      res.status(400).json({ error: "Note must be 300 characters or less" });
      return;
    }
    reason = note.trim() || null;
  }

  const result = await prisma.$transaction(async (tx) => {
    const need = await tx.buyerNeed.findUnique({ where: { id } });
    if (!need) return { code: 404 as const };
    if (need.status !== "OPEN") return { code: 409 as const };

    const updated = await tx.buyerNeed.update({ where: { id }, data: { status: "CANCELLED" } });

    const pending = await tx.offer.findMany({
      where: { needId: id, status: "PENDING" },
      select: { id: true, fisherId: true },
    });
    if (pending.length > 0) {
      await tx.offer.updateMany({
        where: { id: { in: pending.map((o) => o.id) } },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
      await tx.notification.createMany({
        data: pending.map((o) => ({
          userId: o.fisherId,
          type: "OFFER" as const,
          title: "Offer closed",
          body: "The buyer's request was removed by an admin.",
        })),
      });
    }
    await tx.notification.create({
      data: {
        userId: need.buyerId,
        type: "SYSTEM",
        title: "Request removed",
        body: reason ?? "An admin removed your request.",
      },
    });
    return { code: 200 as const, need: updated };
  });

  if (result.code === 404) {
    res.status(404).json({ error: "Need not found" });
    return;
  }
  if (result.code === 409) {
    res.status(409).json({ error: "This need is already closed" });
    return;
  }
  res.json(result.need);
});