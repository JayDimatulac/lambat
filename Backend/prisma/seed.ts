import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// l0Min / l0Max: shelf life in hours at 0°C (from the frontend species.ts).
// histamine: tuna and mackerel get a narrow, cautious range.
const species = [
  { code: "skipjack", englishName: "Skipjack tuna", scientificName: "Katsuwonus pelamis", localNames: ["Gulyasan"], l0Min: 192, l0Max: 192, histamine: true },
  { code: "roughear", englishName: "Roughear scad", scientificName: "Decapterus tabl", localNames: ["Galunggong", "Burot bilog"], l0Min: 144, l0Max: 240, histamine: false },
  { code: "shortfin", englishName: "Shortfin scad", scientificName: "Decapterus macrosoma", localNames: ["Galunggong", "Galunggong na Lalaki", "Tinabako"], l0Min: 288, l0Max: 360, histamine: false },
  { code: "mackerelScad", englishName: "Mackerel scad", scientificName: "Decapterus macarellus", localNames: ["Galunggong"], l0Min: 120, l0Max: 168, histamine: false },
  { code: "bigeye", englishName: "Bigeye scad", scientificName: "Selar crumenophthalmus", localNames: ["Matambaka", "Burow"], l0Min: 240, l0Max: 336, histamine: false },
  { code: "bali", englishName: "Bali sardinella", scientificName: "Sardinella lemuru", localNames: ["Tamban", "Tunsoy", "Tapulok"], l0Min: 144, l0Max: 144, histamine: false },
  { code: "islandMackerel", englishName: "Island mackerel", scientificName: "Rastrelliger faughni", localNames: ["Alumahan"], l0Min: 144, l0Max: 144, histamine: true },
  { code: "bullet", englishName: "Bullet tuna", scientificName: "Auxis rochei", localNames: ["Tulingang bilog"], l0Min: 192, l0Max: 192, histamine: true },
  { code: "yellowfin", englishName: "Yellowfin tuna", scientificName: "Thunnus albacares", localNames: ["Tambakol"], l0Min: 288, l0Max: 288, histamine: true },
  { code: "moonfish", englishName: "Moonfish", scientificName: "Mene maculata", localNames: ["Hiwas"], l0Min: 168, l0Max: 192, histamine: false },
];

async function main() {
  for (const s of species) {
    await prisma.species.upsert({
      where: { englishName: s.englishName },
      update: {
        code: s.code,
        scientificName: s.scientificName,
        localNames: s.localNames,
        l0Min: s.l0Min,
        l0Max: s.l0Max,
        histamine: s.histamine,
      },
      create: s,
    });
  }
  console.log(`Seeded ${species.length} species`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());