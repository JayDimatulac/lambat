import { Router } from "express";
import bcrypt from "bcrypt";
import type { AccountStatus, Role } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { normalizeMobile } from "./auth";

export const adminRouter = Router();

// every route in this file is admin-only
adminRouter.use(requireAuth, requireRole("ADMIN"));

const ROLES: Role[] = ["FISHERFOLK", "BUYER", "ADMIN", "ORGANIZATION"];
const STATUSES: AccountStatus[] = ["ACTIVE", "PENDING", "SUSPENDED"];

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
adminRouter.patch("/users/:id/status", async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { status } = req.body ?? {};
  const id = String(req.params.id);

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    res.status(400).json({ error: "Status must be ACTIVE or SUSPENDED" });
    return;
  }
  if (id === userId) {
    res.status(400).json({ error: "You can't change your own account status" });
    return;
  }

  const found = await prisma.user.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    omit: { passwordHash: true },
  });

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