import "dotenv/config";
import { prisma } from "../src/db";

// Usage: npx tsx prisma\remove-admin.ts <old mobile> <new admin mobile> [--confirm]
// Without --confirm it only prints what it would do.
async function main() {
  const [oldMobile, newMobile, flag] = process.argv.slice(2);
  const confirm = flag === "--confirm";

  if (!oldMobile || !newMobile) {
    console.error("Usage: npx tsx prisma\\remove-admin.ts <old mobile> <new admin mobile> [--confirm]");
    process.exit(1);
  }

  const oldUser = await prisma.user.findUnique({
    where: { mobile: oldMobile },
    select: {
      id: true, name: true, role: true,
      _count: {
        select: {
          catches: true, needs: true, offersMade: true, offersReceived: true,
          ordersSelling: true, ordersBuying: true, advisories: true,
        },
      },
    },
  });
  const newUser = await prisma.user.findUnique({
    where: { mobile: newMobile },
    select: { id: true, name: true, role: true, status: true },
  });

  if (!oldUser) { console.error("Old account not found"); process.exit(1); }
  if (!newUser) { console.error("New admin account not found"); process.exit(1); }
  if (oldUser.id === newUser.id) { console.error("Old and new are the same account"); process.exit(1); }
  if (newUser.role !== "ADMIN" && newUser.role !== "SUPER_ADMIN") {
    console.error("The new owner must be an ADMIN or SUPER_ADMIN"); process.exit(1);
  }
  if (newUser.status !== "ACTIVE") { console.error("The new owner must be ACTIVE"); process.exit(1); }

  const c = oldUser._count;
  const blocking = c.catches + c.needs + c.offersMade + c.offersReceived + c.ordersSelling + c.ordersBuying;
  if (blocking > 0) {
    console.error("This account owns catches, needs, offers or orders. Not deleting.", c);
    process.exit(1);
  }

  console.log(`Plan: move ${c.advisories} advisories from "${oldUser.name}" to "${newUser.name}", then delete "${oldUser.name}".`);
  if (!confirm) {
    console.log("Dry run only. Add --confirm to do it.");
    return;
  }

  await prisma.$transaction([
    prisma.advisory.updateMany({ where: { createdById: oldUser.id }, data: { createdById: newUser.id } }),
    prisma.otpCode.deleteMany({ where: { userId: oldUser.id } }),
    prisma.resetToken.deleteMany({ where: { userId: oldUser.id } }),
    prisma.user.delete({ where: { id: oldUser.id } }),
  ]);
  console.log("Done. Old account removed.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());