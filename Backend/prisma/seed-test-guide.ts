import "dotenv/config";
import { prisma } from "../src/db";

// usage: npx ts-node prisma/seed-test-guide.ts "<species englishName>" "<product name as shown on the pathway card>"
async function main() {
  const [speciesName, product] = process.argv.slice(2);
  if (!speciesName || !product) {
    console.error('Usage: npx ts-node prisma/seed-test-guide.ts "<species englishName>" "<product>"');
    process.exit(1);
  }
  const species = await prisma.species.findFirst({
    where: {
      OR: [
        { englishName: { equals: speciesName, mode: "insensitive" } },
        { code: { equals: speciesName, mode: "insensitive" } },
        { localNames: { has: speciesName } }, // exact spelling and capitalisation, e.g. "Galunggong"
      ],
    },
  });
  if (!species) {
    console.error("No species with that englishName");
    process.exit(1);
  }
  await prisma.processingGuide.upsert({
    where: { speciesId_product: { speciesId: species.id, product } },
    update: {},
    create: {
      speciesId: species.id,
      product,
      description: "[TEST] Placeholder product description.",
      requiresIce: false,
      allowedRisks: ["LOW", "MEDIUM"],
      equipment: ["[TEST] equipment one"],
      ingredients: ["[TEST] ingredient one"],
      preparation: ["[TEST] preparation item one"],
      steps: [{ en: "[TEST] Step one.", fil: "[TEST] Unang hakbang." }, { en: "[TEST] Step two." }],
      safety: ["[TEST] safety reminder one"],
      sourceTitle: "[TEST] Not a real source",
      sourceIssuer: "[TEST]",
      verified: true,
    },
  });
  console.log("Test guide saved for", species.englishName, "/", product);
}

main().catch(console.error).finally(() => prisma.$disconnect());