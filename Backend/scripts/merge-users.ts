// scripts/merge-users.ts
import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const sourceUrl = process.env.SOURCE_DATABASE_URL!;
const targetUrl = process.env.TARGET_DATABASE_URL!;

if (!sourceUrl || !targetUrl) throw new Error("Missing SOURCE_DATABASE_URL or TARGET_DATABASE_URL");
if (sourceUrl === targetUrl) throw new Error("SOURCE and TARGET are the same database");

const makeClient = (url: string) =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const source = makeClient(sourceUrl);
const target = makeClient(targetUrl);

async function main() {
  const sourceUsers = await source.user.findMany();
  const targetUsers = await target.user.findMany({ select: { id: true, mobile: true } });

  const ids = new Set(targetUsers.map((u) => u.id));
  const mobiles = new Set(targetUsers.map((u) => u.mobile));

  const alreadyThere = sourceUsers.filter((u) => ids.has(u.id));
  const clashes = sourceUsers.filter((u) => !ids.has(u.id) && mobiles.has(u.mobile));
  const toCopy = sourceUsers.filter((u) => !ids.has(u.id) && !mobiles.has(u.mobile));

  console.log({
    inSource: sourceUsers.length,
    alreadyInTarget: alreadyThere.length,
    mobileClashes: clashes.map((u) => u.mobile),
    willCopy: toCopy.map((u) => `${u.mobile} ${u.name} ${u.role}`),
  });

  if (process.env.DRY_RUN === "false") {
    const data = toCopy.map((u) => ({
      ...u,
      profile: u.profile === null ? Prisma.JsonNull : (u.profile as Prisma.InputJsonValue),
    }));
    const res = await target.user.createMany({ data, skipDuplicates: true });
    console.log("copied", res.count);
  } else {
    console.log("Dry run only. Set DRY_RUN=false to copy.");
  }
}

main().finally(async () => {
  await source.$disconnect();
  await target.$disconnect();
});