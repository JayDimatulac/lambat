import "dotenv/config";
import { prisma } from "../src/db";

async function main() {
  const mobile = process.argv[2];
  const u = await prisma.user.findUnique({
    where: { mobile },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          catches: true,
          advisories: true,
          notifications: true,
          needs: true,
          offersMade: true,
          offersReceived: true,
          ordersSelling: true,
          ordersBuying: true,
        },
      },
    },
  });
  console.log(u);
  if (u) {
    console.log("OTP rows:", await prisma.otpCode.count({ where: { userId: u.id } }));
    console.log("Reset tokens:", await prisma.resetToken.count({ where: { userId: u.id } }));
  }
}
main().finally(() => prisma.$disconnect());