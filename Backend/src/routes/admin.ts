import { Router } from "express";
import bcrypt from "bcrypt";
import type { AccountStatus, Role, RiskLevel } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { normalizeMobile } from "./auth";

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
// Set a species' shelf life at 0 C, in hours (send null to clear it)
adminRouter.patch("/species/:id", async (req, res) => {
  const { shelfLifeHoursAt0C } = req.body ?? {};
  const id = String(req.params.id);

  const valid =
    shelfLifeHoursAt0C === null ||
    (Number.isInteger(shelfLifeHoursAt0C) && shelfLifeHoursAt0C > 0 && shelfLifeHoursAt0C <= 2000);
  if (!valid) {
    res.status(400).json({ error: "Hours must be a whole number from 1 to 2000, or null" });
    return;
  }

  const found = await prisma.species.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "Species not found" });
    return;
  }

  const updated = await prisma.species.update({ where: { id }, data: { shelfLifeHoursAt0C } });
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