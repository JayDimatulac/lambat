import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const item = z.object({
  ref: z.string().regex(/^[A-Z0-9]{2,12}$/),
  speciesId: z.string().min(1).max(60),
  kilos: z.number().positive().max(100000),
  iceKg: z.number().min(0).max(100000).default(0),
  place: z.string().max(80).optional(),
  caughtAt: z.string().datetime(), // ISO, e.g. new Date().toISOString()
});

router.post("/sync", requireAuth, requireRole("FISHERFOLK"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") {
    res.status(403).json({ error: "Account not active" });
    return;
  }

  const items = z.array(item).max(50).parse(req.body);
  const synced: string[] = [];
  const rejected: { ref: string; reason: string }[] = [];
  const now = Date.now();

  for (const c of items) {
    const when = new Date(c.caughtAt);
    if (when.getTime() > now + 5 * 60_000) { rejected.push({ ref: c.ref, reason: "future time" }); continue; }
    if (when.getTime() < now - 30 * 86_400_000) { rejected.push({ ref: c.ref, reason: "too old" }); continue; }

    const species = await prisma.species.findUnique({ where: { id: c.speciesId } });
    if (!species) { rejected.push({ ref: c.ref, reason: "unknown species" }); continue; }

    try {
      await prisma.catchBatch.create({
        data: {
          userId, speciesId: c.speciesId, kilos: c.kilos,
          place: c.place?.trim() || null, caughtAt: when,
          clientRef: c.ref, source: "api",
          iceEvents: { create: [{ at: when, iceKg: c.iceKg }] },
        },
      });
      synced.push(c.ref);
    } catch (e: any) {
      if (e.code === "P2002") synced.push(c.ref); // already saved (maybe earlier by SMS), safe to clear from the queue
      else { console.error(e); rejected.push({ ref: c.ref, reason: "server error" }); }
    }
  }
  res.json({ synced, rejected });
});

export default router;