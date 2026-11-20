import { prisma } from "../db";
import { assess } from "../lib/engine";

// Raise a "needs action" notice once per catch and per level (high, then critical).
// The unique dedupeKey makes this safe to run again and again.
// Give a userId to check one person's catches, or leave it out to check everyone's.
export async function raiseRiskNotices(userId?: string): Promise<number> {
  const catches = await prisma.catchBatch.findMany({
    where: { status: "ACTIVE", ...(userId ? { userId } : {}) },
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
      userId: c.userId,
      type: "HIGH_RISK" as const,
      catchId: c.id,
      dedupeKey: `risk:${c.id}:${a.risk}`,
      title: a.risk === "critical" ? "Catch is almost out of time" : "Catch needs action",
      body: `${c.species.englishName}, ${c.kilos} kg: about ${range} hours left. Selling or sharing soon is the safer choice.`,
    });
  }

  if (rows.length === 0) return 0;
  const result = await prisma.notification.createMany({ data: rows, skipDuplicates: true });
  return result.count;
}