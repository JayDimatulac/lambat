import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// My latest 50 notifications (optional ?unread=true) and how many are unread
notificationsRouter.get("/", async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const unreadOnly = req.query.unread === "true";

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