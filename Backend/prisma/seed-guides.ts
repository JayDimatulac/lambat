import "dotenv/config";
import type { RiskLevel } from "@prisma/client";
import { prisma } from "../src/db";

// Real processing guides for the knowledge base. Replaces the [TEST] placeholder rows.
//
//   npx ts-node prisma/seed-guides.ts              saves the guides as NOT verified (the app will say "not yet available")
//   npx ts-node prisma/seed-guides.ts --verified   saves them as verified, so the app shows them
//
// Only use --verified after someone has read every line below against the source PDF.
const VERIFIED = process.argv.includes("--verified");

// Every species the app shows as "Galunggong". The source names Decapterus macrosoma (code "shortfin").
// Delete the codes your team does not want to treat as the same product.
const GALUNGGONG_CODES = ["shortfin", "roughear", "mackerelScad"];

// The source asks for fresh or freshly chilled fish, so only low-risk catches are allowed.
// Add "MEDIUM" only if the team decides that is acceptable.
const ALLOWED_RISKS: RiskLevel[] = ["LOW"];

const TINAPA = {
  product: "Tinapa", // must match the pathway name on the card
  description:
    "Tinapa is smoked fish. The fish is cleaned, soaked in salt brine, boiled briefly in brine, then hot-smoked until golden brown. This guide follows the DOST-ITDI procedure for smoked round scad (galunggong).",
  requiresIce: true, // the source asks for fresh or freshly chilled fish, so a catch with no ice recorded is not enough
  allowedRisks: ALLOWED_RISKS,
  equipment: [
    "Smokehouse (the brochure shows a drum-type smokehouse you can build)",
    "Smoking trays (stainless steel is best where they touch the fish)",
    "Knife, basin and a pot or carajay for the brine",
    "Cooking baskets or trays",
    "Water sprinkler for rinsing",
    "Weighing scale (or salinometer) to measure salt and water",
    "Dial thermometer for the smoke temperature",
    "Plastic bags (polyethylene or polypropylene) and a sealer",
  ],
  ingredients: [
    "Fresh or freshly chilled galunggong, not damaged",
    "Clean, food-grade salt (coarse or fine)",
    "Clean drinking water",
    "Hardwood sawdust or shavings for smoking",
  ],
  preparation: [
    "The fish is fresh: bright skin, clear eyes, red gills, firm flesh, fresh smell",
    "25% brine is ready: about 1 part salt to 2 parts water, by weight, as much brine as fish",
    "15% brine is ready for cooking: about 1 part salt to 4 parts water",
    "The smokehouse, smoking trays and hardwood sawdust or shavings are ready",
    "Plastic bags (0.002-inch thick) are ready, and there is a place to keep the packed fish at 3 to 5°C",
  ],
  steps: [
    {
      en: "Wash the fish, remove the insides (entrails and gills), and wash again well to remove the remaining blood. Drain.",
      fil: "Hugasan ang isda, tanggalin ang lamang-loob (bituka at hasang), at hugasan ulit nang mabuti para matanggal ang natirang dugo. Patuluin.",
    },
    {
      en: "Soak the fish for 30 minutes in 25% brine (about 1 part salt to 2 parts water, by weight), using 1 part fish to 1 part brine. Drain, then put the fish on cooking trays or in baskets.",
      fil: "Ibabad ang isda nang 30 minuto sa 25% na brine (humigit-kumulang 1 bahagi ng asin sa 2 bahagi ng tubig, ayon sa timbang). Kasing-bigat ng isda ang brine. Patuluin, saka ilagay sa mga tray o basket na pangluto.",
    },
    {
      en: "Cook the fish in 15% brine (about 1 part salt to 4 parts water) at a vigorous boil for 3 to 4 minutes. Drain.",
      fil: "Lutuin ang isda sa 15% na brine (humigit-kumulang 1 bahagi ng asin sa 4 na bahagi ng tubig) nang 3 hanggang 4 na minuto, sa malakas na kulo. Patuluin.",
    },
    {
      en: "Lay the cooked fish on smoking trays and sprinkle with water to rinse off the surface salt.",
      fil: "Ilatag ang nilutong isda sa mga smoking tray at wisikan ng tubig para matanggal ang asin sa ibabaw.",
    },
    {
      en: "Hot smoke the fish in the smokehouse at 60 to 90°C until it turns golden brown.",
      fil: "I-hot smoke ang isda sa smokehouse sa 60 hanggang 90°C hanggang maging golden brown.",
    },
    {
      en: "Cool the smoked fish to room temperature (28 to 30°C).",
      fil: "Palamigin ang pinausukang isda hanggang sa temperatura ng silid (28 hanggang 30°C).",
    },
    {
      en: "Pack the smoked fish in polypropylene or polyethylene plastic bags, at least 0.002 inch thick.",
      fil: "Ilagay ang pinausukang isda sa plastic na polypropylene o polyethylene na hindi bababa sa 0.002 pulgada ang kapal.",
    },
    {
      en: "Store the packed fish at room temperature (28 to 30°C), or in the refrigerator (3 to 5°C) for a longer shelf life.",
      fil: "Itabi ang nakabalot na isda sa temperatura ng silid (28 hanggang 30°C), o sa ref (3 hanggang 5°C) para tumagal pa.",
    },
  ],
  safety: [
    "Use only fresh or freshly chilled fish. Stale fish has loose scales, cloudy sunken eyes, gray or brown gills, soft flesh that keeps a finger mark, and a sour smell.",
    "Do not use coconut lumber sawdust or rice husks for smoking. They make a lot of fly ash. Use hardwood sawdust or shavings.",
    "Smoked fish spoils easily because it is 70 to 80% water. Sell it soon after making it, or keep it chilled or frozen.",
    "At room temperature (28 to 32°C) the product keeps only 2 to 3 days. Chilled (5 to 10°C) it keeps about 2 weeks.",
    "Use clean, food-grade salt and clean drinking water.",
  ],
  sourceTitle: "Smoked Fish Production (Livelihood Technology Series 27), 2nd edition",
  sourceIssuer: "Industrial Technology Development Institute, Department of Science and Technology (DOST-ITDI)",
  sourceVersion: "2nd edition, 2014",
  sourceUrl: "https://www.itdi.dost.gov.ph/images/LivelihoodTechnologyBrochures/27-Smoked_Fish_Production.pdf",
};

async function main() {
  // the old placeholder rows must not stay in the database
  const removed = await prisma.processingGuide.deleteMany({ where: { sourceTitle: { startsWith: "[TEST]" } } });
  console.log(`Removed ${removed.count} [TEST] guide(s).`);

  for (const code of GALUNGGONG_CODES) {
    const species = await prisma.species.findFirst({ where: { code } });
    if (!species) {
      console.log(`Skipped "${code}": no species with that code.`);
      continue;
    }
    const data = { ...TINAPA, verified: VERIFIED };
    await prisma.processingGuide.upsert({
      where: { speciesId_product: { speciesId: species.id, product: TINAPA.product } },
      create: { speciesId: species.id, ...data },
      update: data,
    });
    console.log(`Saved ${TINAPA.product} for ${species.englishName} (verified: ${VERIFIED}).`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());