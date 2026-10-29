import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const species = [
  { englishName: "Skipjack tuna", scientificName: "Katsuwonus pelamis", localNames: ["Gulyasan"] },
  { englishName: "Roughear scad", scientificName: "Decapterus tabl", localNames: ["Galunggong", "Burot bilog"] },
  { englishName: "Shortfin scad", scientificName: "Decapterus macrosoma", localNames: ["Galunggong", "Galunggong na Lalaki", "Tinabako"] },
  { englishName: "Mackerel scad", scientificName: "Decapterus macarellus", localNames: ["Galunggong"] },
  { englishName: "Bigeye scad", scientificName: "Selar crumenophthalmus", localNames: ["Matambaka", "Burow"] },
  { englishName: "Bali sardinella", scientificName: "Sardinella lemuru", localNames: ["Tamban", "Tunsoy", "Tapulok"] },
  { englishName: "Island mackerel", scientificName: "Rastrelliger faughni", localNames: ["Alumahan"] },
  { englishName: "Bullet tuna", scientificName: "Auxis rochei", localNames: ["Tulingang bilog"] },
  { englishName: "Yellowfin tuna", scientificName: "Thunnus albacares", localNames: ["Tambakol"] },
  { englishName: "Moonfish", scientificName: "Mene maculata", localNames: ["Hiwas"] },
];

async function main() {
  for (const s of species) {
    await prisma.species.upsert({
      where: { englishName: s.englishName },
      update: { scientificName: s.scientificName, localNames: s.localNames },
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