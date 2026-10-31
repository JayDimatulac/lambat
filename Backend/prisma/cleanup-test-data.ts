import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes("--yes");
  // the regression test accounts; --include-demo also removes the demo accounts from seed-demo.ts
  const prefixes = ["0917000", ...(process.argv.includes("--include-demo") ? ["0918100"] : [])];

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" }, OR: prefixes.map((p) => ({ mobile: { startsWith: p } })) },
    select: { id: true, name: true, mobile: true, role: true },
  });
  const ids = users.map((u) => u.id);
  const pathways = await prisma.pathway.findMany({ where: { name: { startsWith: "TEST pathway" } }, select: { id: true } });
  const advisories = await prisma.advisory.findMany({ where: { title: "Regression test advisory" }, select: { id: true } });

  console.log("Accounts to delete (admins are never touched):");
  console.table(users);
  console.log(`Test pathways: ${pathways.length}, test advisories: ${advisories.length}`);
  console.log("Their catches, ice events, needs, offers, orders and notifications go with them.");

  if (!apply) {
    console.log("\nDry run: nothing was deleted. Add --yes to delete.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    const offers = await tx.offer.findMany({
      where: {
        OR: [
          { fisherId: { in: ids } },
          { buyerId: { in: ids } },
          { catch: { userId: { in: ids } } },
          { need: { buyerId: { in: ids } } },
        ],
      },
      select: { id: true },
    });
    const offerIds = offers.map((o) => o.id);

    await tx.order.deleteMany({
      where: {
        OR: [
          { offerId: { in: offerIds } },
          { fisherId: { in: ids } },
          { buyerId: { in: ids } },
          { catch: { userId: { in: ids } } },
        ],
      },
    });
    await tx.offer.deleteMany({ where: { id: { in: offerIds } } });
    await tx.buyerNeed.deleteMany({ where: { buyerId: { in: ids } } });
    await tx.catchBatch.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.deleteMany({ where: { id: { in: ids } } });
    await tx.pathway.deleteMany({ where: { id: { in: pathways.map((p) => p.id) } } });
    await tx.advisory.deleteMany({ where: { id: { in: advisories.map((a) => a.id) } } });
  });

  console.log("\nDeleted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());