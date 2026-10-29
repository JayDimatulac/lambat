import { Router } from "express";
import type { AdvisorySeverity, Role } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const advisoriesRouter = Router();

const SEVERITIES: AdvisorySeverity[] = ["INFO", "WARNING", "DANGER"];
const ROLES: Role[] = ["FISHERFOLK", "BUYER", "ADMIN", "ORGANIZATION"];

// Active advisories meant for me (any logged-in user)
advisoriesRouter.get("/", requireAuth, async (_req, res) => {
  const { role } = res.locals.auth as { role: Role };
  const now = new Date();

  const advisories = await prisma.advisory.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        { OR: [{ audience: null }, { audience: role }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, severity: true, expiresAt: true, createdAt: true },
  });

  res.json(advisories);
});

// Admin: every advisory, including old and switched-off ones
advisoriesRouter.get("/all", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const advisories = await prisma.advisory.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  res.json(advisories);
});

// Admin: post an advisory and notify everyone it is meant for
advisoriesRouter.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { title, body, severity, audience, expiresAt } = req.body ?? {};

  if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
    res.status(400).json({ error: "Title is required (up to 120 characters)" });
    return;
  }
  if (typeof body !== "string" || !body.trim() || body.trim().length > 1000) {
    res.status(400).json({ error: "Message is required (up to 1000 characters)" });
    return;
  }
  const sev: AdvisorySeverity = severity === undefined ? "INFO" : severity;
  if (!SEVERITIES.includes(sev)) {
    res.status(400).json({ error: "Severity must be INFO, WARNING or DANGER" });
    return;
  }
  let aud: Role | null = null;
  if (audience !== undefined && audience !== null) {
    if (!ROLES.includes(audience)) {
      res.status(400).json({ error: "Unknown audience" });
      return;
    }
    aud = audience;
  }
  let expires: Date | null = null;
  if (expiresAt !== undefined && expiresAt !== null) {
    expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
      res.status(400).json({ error: "Expiry must be a future date" });
      return;
    }
  }

  const advisory = await prisma.advisory.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      severity: sev,
      audience: aud,
      expiresAt: expires,
      createdById: userId,
    },
  });

  const recipients = await prisma.user.findMany({
    where: { status: "ACTIVE", ...(aud ? { role: aud } : {}) },
    select: { id: true },
  });

  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((u) => ({
        userId: u.id,
        type: "ADVISORY" as const,
        title: advisory.title,
        body: advisory.body,
        advisoryId: advisory.id,
      })),
    });
  }

  res.status(201).json({ ...advisory, notified: recipients.length });
});

// Admin: switch an advisory off (people keep the notification they already got)
advisoriesRouter.patch("/:id/deactivate", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const id = String(req.params.id);
  const found = await prisma.advisory.findUnique({ where: { id } });
  if (!found) {
    res.status(404).json({ error: "Advisory not found" });
    return;
  }
  const updated = await prisma.advisory.update({ where: { id }, data: { active: false } });
  res.json(updated);
});