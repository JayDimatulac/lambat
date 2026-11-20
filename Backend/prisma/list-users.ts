import "dotenv/config";
import { prisma } from "../src/db";


async function main() {
  const users = await prisma.user.findMany({
    select: { mobile: true, role: true, status: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  console.table(users);
}

main().finally(() => prisma.$disconnect());