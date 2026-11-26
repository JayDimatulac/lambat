import "dotenv/config";
import { prisma } from "../src/db";

async function main() {
  const info: any = await prisma.$queryRaw`select current_database() as db, current_schema() as schema`;
  const users: any = await prisma.$queryRaw`select count(*)::int as n from "User"`;
  console.log("database:", info[0].db, "| schema:", info[0].schema, "| users:", users[0].n);
}
main().catch((e) => console.log("error:", e.message)).finally(() => prisma.$disconnect());
