import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { assess } from "../src/lib/engine";

const prisma = new PrismaClient();

async function main() {
  const [code = "skipjack", kilosArg = "10", hoursArg = "0", iceArg = "0"] = process.argv.slice(2);
  const kilos = Number(kilosArg);
  const hoursAgo = Number(hoursArg);
  const startIce = Number(iceArg);

  if (![kilos, hoursAgo, startIce].every(Number.isFinite) || kilos <= 0 || hoursAgo < 0 || startIce < 0) {
    console.error("Usage: npx ts-node prisma\\ice-check.ts <species code> <fish kg> <hours since catch> <ice kg already on it>");
    console.error("Example: npx ts-node prisma\\ice-check.ts skipjack 10 0 0");
    process.exit(1);
  }

  const sp = await prisma.species.findUnique({ where: { code } });
  if (!sp) {
    const all = await prisma.species.findMany({ select: { code: true } });
    console.error(`Unknown species code "${code}". Codes: ${all.map((s) => s.code).join(", ")}`);
    process.exit(1);
  }

  const now = new Date();
  const caughtAt = new Date(now.getTime() - hoursAgo * 3_600_000);

  const rows = [0, 1, 2, 3, 5, 10, 25, 50].map((add) => {
    const events = [{ at: caughtAt, iceKg: startIce }];
    if (add > 0) events.push({ at: now, iceKg: startIce + add });
    const a = assess({ caughtAt, kilos }, events, sp, now);
    return {
      "ice added (kg)": add,
      "total ice (kg)": startIce + add,
      "ice level": a.iceLevel,
      "hours left": a.hoursMin === null ? "-" : `${a.hoursMin} to ${a.hoursMax}`,
      risk: a.risk,
    };
  });

  console.log(`${sp.englishName}, ${kilos} kg, caught ${hoursAgo} h ago, ${startIce} kg of ice on it now:`);
  console.table(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());