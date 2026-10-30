import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [mobile, name, password] = process.argv.slice(2);

  if (!mobile || !name || !password) {
    console.error('Usage: npx ts-node prisma\\create-admin.ts 09XXXXXXXXX "Full Name" "password"');
    process.exit(1);
  }
  if (!/^09\d{9}$/.test(mobile)) {
    console.error("Mobile must look like 09171234567");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { mobile } });

  if (existing) {
    if (existing.role !== "ADMIN") {
      console.error("That mobile number belongs to a non-admin account. Use a different number.");
      process.exit(1);
    }
    await prisma.user.update({
      where: { mobile },
      data: { passwordHash, name, status: "ACTIVE" },
    });
    console.log("Existing admin updated: password reset and account set to ACTIVE.");
    return;
  }

  await prisma.user.create({
    data: {
      role: "ADMIN",
      status: "ACTIVE",
      name,
      mobile,
      barangay: "N/A",
      passwordHash,
    },
  });
  console.log("Admin created. You can log in with that mobile number.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());