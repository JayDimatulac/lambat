import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { assess } from "../lib/engine";

export const offersRouter = Router();

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const catchSelect = {
  id: true,
  kilos: true,
  place: true,
  caughtAt: true,
  status: true,
  species: {
    select: { id: true, code: true, englishName: true, localNames: true, l0Min: true, l0Max: true, histamine: true },
  },
  iceEvents: { select: { at: true, iceKg: true }, orderBy: { at: "asc" as const } },
};

const offerInclude = {
  catch: { select: catchSelect },
  fisher: { select: { id: true, name: true, barangay: true } },
  buyer: { select: { id: true, name: true, businessName: true, buyerType: true, barangay: true } },
  order: { select: { id: true, status: true } },
};

// buyers should see how fresh the catch is
function shape<
  T extends {
    catch: {
      status: string;
      caughtAt: Date;
      kilos: number;
      iceEvents: { at: Date; iceKg: number }[];
      species: { l0Min: number | null; l0Max: number | null; histamine: boolean };
    };
  }
>(o: T) {
  const c = o.catch;
  return {
    ...o,
    catch: {
      ...c,
      assessment: c.status === "ACTIVE" ? assess(c, c.iceEvents, c.species) : null,
    },
  };
}

// Fisherfolk sends an offer to a buyer
offersRouter.post("/", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.status !== "ACTIVE") {
    res.status(403).json({ error: "Account not active" });
    return;
  }

  const { catchId, buyerId, kilos, pricePerKg, needId, message } = req.body ?? {};

  if (typeof catchId !== "string" || typeof buyerId !== "string") {
    res.status(400).json({ error: "Choose a catch and a buyer" });
    return;
  }
  const c = await prisma.catchBatch.findUnique({ where: { id: catchId } });
  if (!c || c.userId !== userId) {
    res.status(404).json({ error: "Catch not found" });
    return;
  }
  if (c.status !== "ACTIVE") {
    res.status(409).json({ error: "This catch already has an outcome" });
    return;
  }

  const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
  if (!buyer || buyer.role !== "BUYER" || buyer.status !== "ACTIVE") {
    res.status(400).json({ error: "That buyer is not available" });
    return;
  }

  if (typeof kilos !== "number" || !(kilos > 0) || kilos > c.kilos) {
    res.status(400).json({ error: `Kilos must be more than 0 and up to ${c.kilos}` });
    return;
  }
  if (typeof pricePerKg !== "number" || !(pricePerKg > 0) || pricePerKg > 100000) {
    res.status(400).json({ error: "Price per kilo must be more than 0" });
    return;
  }
  let text: string | null = null;
  if (message !== undefined && message !== null) {
    if (typeof message !== "string" || message.length > 300) {
      res.status(400).json({ error: "Message must be 300 characters or less" });
      return;
    }
    text = message.trim() || null;
  }

  let linkedNeed: string | null = null;
  if (needId !== undefined && needId !== null) {
    if (typeof needId !== "string") {
      res.status(400).json({ error: "Invalid need" });
      return;
    }
    const need = await prisma.buyerNeed.findUnique({ where: { id: needId } });
    if (!need || need.buyerId !== buyerId || need.status !== "OPEN" || need.speciesId !== c.speciesId) {
      res.status(400).json({ error: "That need does not match this catch and buyer" });
      return;
    }
    linkedNeed = need.id;
  }

  const hasOrder = await prisma.order.findFirst({
    where: { catchId, status: { in: ["CONFIRMED", "COMPLETED"] } },
  });
  if (hasOrder) {
    res.status(409).json({ error: "This catch already has an order" });
    return;
  }
  const duplicate = await prisma.offer.findFirst({ where: { catchId, buyerId, status: "PENDING" } });
  if (duplicate) {
    res.status(409).json({ error: "You already sent this buyer an offer for this catch" });
    return;
  }

  const offer = await prisma.offer.create({
    data: { catchId, fisherId: userId, buyerId, needId: linkedNeed, kilos, pricePerKg, message: text },
    include: offerInclude,
  });

  await prisma.notification.create({
    data: {
      userId: buyerId,
      type: "OFFER",
      title: "New offer",
      body: `${me.name} offers ${kilos} kg at ${pricePerKg} per kg.`,
    },
  });

  res.status(201).json(shape(offer));
});

// My offers: sent ones for fisherfolk, received ones for buyers
offersRouter.get("/mine", requireAuth, async (_req, res) => {
  const { userId, role } = res.locals.auth as { userId: string; role: string };
  if (role !== "FISHERFOLK" && role !== "BUYER") {
    res.status(403).json({ error: "You don't have access to this" });
    return;
  }
  const offers = await prisma.offer.findMany({
    where: role === "FISHERFOLK" ? { fisherId: userId } : { buyerId: userId },
    orderBy: { createdAt: "desc" },
    include: offerInclude,
  });
  res.json(offers.map(shape));
});

// Buyer accepts: creates the order and expires their other pending offers on that catch
offersRouter.patch("/:id/accept", requireAuth, requireRole("BUYER"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const id = String(req.params.id);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({ where: { id }, include: { catch: true } });
      if (!offer || offer.buyerId !== userId) throw new HttpError(404, "Offer not found");

      const buyer = await tx.user.findUnique({ where: { id: userId } });
      if (!buyer || buyer.status !== "ACTIVE") throw new HttpError(403, "Your account is waiting for approval");
      if (offer.catch.status !== "ACTIVE") throw new HttpError(409, "This catch is no longer available");

      const existing = await tx.order.findFirst({
        where: { catchId: offer.catchId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      });
      if (existing) throw new HttpError(409, "This catch already has an order");

      const flipped = await tx.offer.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      if (flipped.count === 0) throw new HttpError(409, "This offer was already answered");

      await tx.offer.updateMany({
        where: { catchId: offer.catchId, status: "PENDING", id: { not: id } },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });

      const created = await tx.order.create({
        data: {
          offerId: id,
          catchId: offer.catchId,
          fisherId: offer.fisherId,
          buyerId: userId,
          kilos: offer.kilos,
          pricePerKg: offer.pricePerKg,
        },
      });

      if (offer.needId) {
        const need = await tx.buyerNeed.findUnique({ where: { id: offer.needId } });
        if (need && offer.kilos >= need.kilos) {
          await tx.buyerNeed.update({ where: { id: need.id }, data: { status: "FULFILLED" } });
        }
      }

      await tx.notification.create({
        data: {
          userId: offer.fisherId,
          type: "OFFER",
          title: "Offer accepted",
          body: `${buyer.businessName ?? buyer.name} accepted your offer of ${offer.kilos} kg.`,
        },
      });

      return created;
    });

    res.json(order);
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: e.message });
      return;
    }
    throw e;
  }
});

async function closePending(
  req: Request,
  res: Response,
  who: "BUYER" | "FISHERFOLK",
  next: "DECLINED" | "WITHDRAWN"
) {
  const { userId } = res.locals.auth as { userId: string };
  const offer = await prisma.offer.findUnique({ where: { id: String(req.params.id) } });
  const mine = offer && (who === "BUYER" ? offer.buyerId === userId : offer.fisherId === userId);
  if (!offer || !mine) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }

  const flipped = await prisma.offer.updateMany({
    where: { id: offer.id, status: "PENDING" },
    data: { status: next, respondedAt: new Date() },
  });
  if (flipped.count === 0) {
    res.status(409).json({ error: "This offer was already answered" });
    return;
  }

  await prisma.notification.create({
    data: {
      userId: who === "BUYER" ? offer.fisherId : offer.buyerId,
      type: "OFFER",
      title: next === "DECLINED" ? "Offer declined" : "Offer withdrawn",
      body:
        next === "DECLINED"
          ? "A buyer declined your offer."
          : "A fisherfolk withdrew their offer.",
    },
  });

  res.json(await prisma.offer.findUnique({ where: { id: offer.id } }));
}

offersRouter.patch("/:id/decline", requireAuth, requireRole("BUYER"), (req, res) =>
  closePending(req, res, "BUYER", "DECLINED")
);

offersRouter.patch("/:id/withdraw", requireAuth, requireRole("FISHERFOLK"), (req, res) =>
  closePending(req, res, "FISHERFOLK", "WITHDRAWN")
);