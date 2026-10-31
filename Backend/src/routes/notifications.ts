import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { assess } from "../lib/engine";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// Raise a "needs action" notice once per catch and per level (high, then critical).
// The unique dedupeKey makes this safe to run on every read.
async function raiseRiskNotices(userId: string) {
  const catches = await prisma.catchBatch.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      species: { select: { englishName: true, l0Min: true, l0Max: true, histamine: true } },
      iceEvents: { select: { at: true, iceKg: true }, orderBy: { at: "asc" } },
    },
  });

  const rows = [];
  for (const c of catches) {
    const a = assess(c, c.iceEvents, c.species);
    if (a.risk !== "high" && a.risk !== "critical") continue;
    const range = a.hoursMin === a.hoursMax ? `${a.hoursMin}` : `${a.hoursMin} to ${a.hoursMax}`;
    rows.push({
      userId,
      type: "HIGH_RISK" as const,
      catchId: c.id,
      dedupeKey: `risk:${c.id}:${a.risk}`,
      title: a.risk === "critical" ? "Catch is almost out of time" : "Catch needs action",
      body: `${c.species.englishName}, ${c.kilos} kg: about ${range} hours left. Selling or sharing soon is the safer choice.`,
    });
  }
  if (rows.length > 0) {
    await prisma.notification.createMany({ data: rows, skipDuplicates: true });
  }
}

// My latest 50 notifications (optional ?unread=true) and how many are unread
notificationsRouter.get("/", async (req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };
  const unreadOnly = req.query.unread === "true";

  // a failed check must never stop the person from seeing their notifications
  if (role === "FISHERFOLK") {
    try {
      await raiseRiskNotices(userId);
    } catch (e) {
      console.error("Risk notice check failed:", e instanceof Error ? e.message : e);
    }
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  res.json({ unreadCount, items });
});

// Mark one as read
notificationsRouter.patch("/:id/read", async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const id = String(req.params.id);

  const found = await prisma.notification.findFirst({ where: { id, userId } });
  if (!found) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: found.readAt ?? new Date() },
  });
  res.json(updated);
});

// Mark all of mine as read
notificationsRouter.post("/read-all", async (_req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ updated: result.count });
});