import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/db";

async function main() {
  const [mobile, password] = process.argv.slice(2);
  const u = await prisma.user.findUnique({ where: { mobile } });
  if (!u) { console.log("no user with that mobile"); return; }
  console.log("role:", u.role, "| status:", u.status);
  console.log("hash prefix:", u.passwordHash.slice(0, 4), "| length:", u.passwordHash.length);
  console.log("password matches:", await bcrypt.compare(password, u.passwordHash));
}
main().finally(() => prisma.$disconnect());
