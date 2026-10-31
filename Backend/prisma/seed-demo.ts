import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import type { CatchStatus } from "@prisma/client";

const prisma = new PrismaClient();
const HOUR = 3_600_000;
const ago = (h: number) => new Date(Date.now() - h * HOUR);

async function main() {
  const password = process.argv[2];
  if (!password || password.length < 8) {
    console.error('Usage: npx ts-node prisma\\seed-demo.ts "a-demo-password" (at least 8 characters)');
    process.exit(1);
  }
  if ((await prisma.user.count({ where: { mobile: { startsWith: "0918100" } } })) > 0) {
    console.error("Demo accounts already exist. Remove them first: npx ts-node prisma\\cleanup-test-data.ts --include-demo --yes");
    process.exit(1);
  }

  const species = await prisma.species.findMany();
  const sp = (code: string) => {
    const s = species.find((x) => x.code === code);
    if (!s) throw new Error(`Species "${code}" is missing. Run: npx ts-node prisma\\seed.ts`);
    return s.id;
  };
  const passwordHash = await bcrypt.hash(password, 10);

  const fisher = await prisma.user.create({
    data: {
      role: "FISHERFOLK", status: "ACTIVE", name: "Mang Ramon", mobile: "09181000001", barangay: "Calan", passwordHash,
      boatOrGear: "motor, net", fishingArea: "near",
      profile: { fisher: { boat: "motor", gear: ["net"], ground: "near", landing: "Balayan" } },
    },
  });
  const buyerOk = await prisma.user.create({
    data: {
      role: "BUYER", status: "ACTIVE", name: "Tonyo Reyes", mobile: "09181000002", barangay: "Poblacion", passwordHash,
      businessName: "Mang Tonyo's Fish Stall", buyerType: "market",
      profile: { buyer: { address: "Balayan Public Market" } },
    },
  });
  await prisma.user.create({
    data: {
      role: "BUYER", status: "PENDING", name: "Berto Magsino", mobile: "09181000003", barangay: "Poblacion", passwordHash,
      businessName: "Berto's Fish Stall", buyerType: "market",
      profile: { buyer: { address: "Balayan Public Market" } },
    },
  });
  await prisma.user.create({
    data: {
      role: "BUYER", status: "REJECTED", name: "Noel Santos", mobile: "09181000004", barangay: "Lemery", passwordHash,
      businessName: "Noel Fish", buyerType: "trader",
      statusNote: "Hindi malinaw ang address ng negosyo. Isulat ang pangalan ng pwesto o palengke.",
      profile: { buyer: { address: "Lemery" } },
    },
  });

  // ice: [hours ago, total ice kg on the fish from then on], the first one is the catch itself
  const addCatch = (
    code: string, kilos: number, ice: [number, number][],
    closed?: { status: CatchStatus; hoursAgo: number; risk: string },
  ) =>
    prisma.catchBatch.create({
      data: {
        userId: fisher.id, speciesId: sp(code), kilos, place: "Balayan", caughtAt: ago(ice[0][0]),
        iceEvents: { create: ice.map(([h, iceKg]) => ({ at: ago(h), iceKg })) },
        ...(closed ? { status: closed.status, closedAt: ago(closed.hoursAgo), closedRisk: closed.risk } : {}),
      },
    });

  await addCatch("bali", 15, [[3, 0]]);
  await addCatch("roughear", 12, [[4, 0]]);
  await addCatch("bullet", 9, [[9, 2]]);
  await addCatch("islandMackerel", 25, [[20, 10], [8, 25]]);
  await addCatch("skipjack", 40, [[6, 40]]);
  await addCatch("yellowfin", 8, [[72, 20]], { status: "SOLD", hoursAgo: 70, risk: "low" });
  await addCatch("moonfish", 6, [[30, 0]], { status: "REDISTRIBUTED", hoursAgo: 28, risk: "moderate" });
  await addCatch("bigeye", 4, [[50, 0]], { status: "DISCARDED", hoursAgo: 48, risk: "high" });

  await prisma.buyerNeed.create({
    data: { buyerId: buyerOk.id, speciesId: sp("bali"), kilos: 20, pricePerKg: 90, barangay: "Poblacion", note: "Pick-up at the market" },
  });

  console.log("Demo accounts ready. All five use the password you gave:");
  console.table([
    { who: "Fisherfolk (Mang Ramon)", mobile: "09181000001" },
    { who: "Buyer, approved (Tonyo)", mobile: "09181000002" },
    { who: "Buyer, waiting (Berto)", mobile: "09181000003" },
    { who: "Buyer, not approved (Noel)", mobile: "09181000004" },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());