import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mobile = process.argv[2];
  const password = process.env.NEW_PASSWORD;

  if (!mobile || !/^09\d{9}$/.test(mobile)) {
    console.error("Usage: npx ts-node prisma\\reset-password.ts 09XXXXXXXXX  (with NEW_PASSWORD set)");
    process.exit(1);
  }
  if (!password || password.length < 8 || password.length > 72) {
    console.error("Set NEW_PASSWORD first: 8 to 72 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) {
    console.error("No account with that mobile number.");
    process.exit(1);
  }
  if (user.role === "ADMIN") {
    console.error("That is an admin account. Reset admins with create-admin.ts instead.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { mobile },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Password reset for ${user.name} (${user.role}, status ${user.status}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());