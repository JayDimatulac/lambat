import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import type { RiskLevel } from "@prisma/client";

const prisma = new PrismaClient();
const RISKS = ["LOW", "MEDIUM", "HIGH"];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

async function main() {
  const file = path.join(__dirname, "pathways.csv");
  if (!fs.existsSync(file)) {
    console.error("prisma\\pathways.csv not found");
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const need = ["species", "allowed_risk_levels", "pathway", "required_conditions", "avoid_conditions", "recommendation"];
  const missing = need.filter((n) => !header.includes(n));
  if (missing.length) {
    console.error("Missing columns: " + missing.join(", "));
    process.exit(1);
  }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();

  const species = await prisma.species.findMany();
  const byName = new Map(species.map((s) => [s.englishName.toLowerCase(), s.id]));

  let saved = 0;
  const problems: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 1;
    const speciesId = byName.get(col(r, "species").toLowerCase());
    const risks = col(r, "allowed_risk_levels")
      .split(/[|;,\/]/)
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean);
    const name = col(r, "pathway");

    if (!speciesId) { problems.push(`Line ${line}: unknown species "${col(r, "species")}"`); continue; }
    if (!name) { problems.push(`Line ${line}: pathway name is empty`); continue; }
    if (risks.length === 0 || risks.some((x) => !RISKS.includes(x))) {
      problems.push(`Line ${line}: risk levels must be LOW, MEDIUM or HIGH (got "${col(r, "allowed_risk_levels")}")`);
      continue;
    }

    const data = {
      allowedRisks: risks as RiskLevel[],
      requiredConditions: col(r, "required_conditions"),
      avoidConditions: col(r, "avoid_conditions"),
      recommendation: col(r, "recommendation"),
      source: header.includes("source") ? col(r, "source") || null : null,
    };

    await prisma.pathway.upsert({
      where: { speciesId_name: { speciesId, name } },
      update: data,
      create: { speciesId, name, ...data },
    });
    saved++;
  }

  console.log(`Imported ${saved} pathway row(s).`);
  if (problems.length) {
    console.log("Skipped:");
    problems.forEach((p) => console.log("  " + p));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());