import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

const orderInclude = {
  catch: {
    select: {
      id: true,
      kilos: true,
      caughtAt: true,
      status: true,
      species: { select: { id: true, englishName: true, localNames: true } },
    },
  },
  fisher: { select: { id: true, name: true, barangay: true } },
  buyer: { select: { id: true, name: true, businessName: true, barangay: true } },
};

// My orders (selling for fisherfolk, buying for buyers)
ordersRouter.get("/mine", async (_req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };
  if (role !== "FISHERFOLK" && role !== "BUYER") {
    res.status(403).json({ error: "You don't have access to this" });
    return;
  }
  const orders = await prisma.order.findMany({
    where: role === "FISHERFOLK" ? { fisherId: userId } : { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  res.json(orders);
});

// Fisherfolk marks the order completed; a full-catch order also marks the catch SOLD
ordersRouter.patch("/:id/complete", async (req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };
  if (role !== "FISHERFOLK") {
    res.status(403).json({ error: "Only the seller can complete an order" });
    return;
  }
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { catch: true },
  });
  if (!order || order.fisherId !== userId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.status !== "CONFIRMED") {
    res.status(409).json({ error: "This order is already closed" });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: order.id, status: "CONFIRMED" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    if (flipped.count === 0) return null;

    if (order.kilos >= order.catch.kilos && order.catch.status === "ACTIVE") {
      await tx.catchBatch.update({ where: { id: order.catchId }, data: { status: "SOLD", closedAt: new Date() } });
    }
    await tx.notification.create({
      data: {
        userId: order.buyerId,
        type: "ORDER",
        title: "Order completed",
        body: `Your order of ${order.kilos} kg was marked completed.`,
      },
    });
    return tx.order.findUnique({ where: { id: order.id } });
  });

  if (!result) {
    res.status(409).json({ error: "This order is already closed" });
    return;
  }
  res.json(result);
});

// Either side can cancel a confirmed order; the catch stays available
ordersRouter.patch("/:id/cancel", async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!order || (order.fisherId !== userId && order.buyerId !== userId)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const flipped = await prisma.order.updateMany({
    where: { id: order.id, status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  });
  if (flipped.count === 0) {
    res.status(409).json({ error: "This order is already closed" });
    return;
  }

  await prisma.notification.create({
    data: {
      userId: order.fisherId === userId ? order.buyerId : order.fisherId,
      type: "ORDER",
      title: "Order cancelled",
      body: "The other side cancelled this order.",
    },
  });

  res.json(await prisma.order.findUnique({ where: { id: order.id } }));
});