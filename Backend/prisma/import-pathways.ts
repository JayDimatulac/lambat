import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import type { RiskLevel } from "@prisma/client";

const prisma = new PrismaClient();
// a pathway can never allow HIGH: high and critical catches never get a suggestion (same rule as the admin API)
const RISKS = ["LOW", "MEDIUM"];

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
  const checkOnly = process.argv.includes("--check");
  const file = path.join(__dirname, "pathways.csv");
  if (!fs.existsSync(file)) {
    console.error("prisma\\pathways.csv not found");
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  if (rows.length < 2) {
    console.error("pathways.csv has no data rows, only the header line (or nothing).");
    process.exit(1);
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const need = ["species", "allowed_risk_levels", "pathway", "required_conditions", "avoid_conditions", "recommendation"];
  const missing = need.filter((n) => !header.includes(n));
  if (missing.length) {
    console.error("Missing columns: " + missing.join(", "));
    console.error("The header line must be: species,allowed_risk_levels,pathway,required_conditions,avoid_conditions,recommendation,source");
    process.exit(1);
  }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();

  const species = await prisma.species.findMany({ orderBy: { englishName: "asc" } });
  const byName = new Map(species.map((s) => [s.englishName.toLowerCase(), s]));
  const perSpecies = new Map<string, number>();

  let ok = 0;
  const problems: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const line = i + 1;
    const sp = byName.get(col(r, "species").toLowerCase());
    const risks = Array.from(
      new Set(
        col(r, "allowed_risk_levels")
          .split(/[|;,\/]/)
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    const name = col(r, "pathway");
    const required = col(r, "required_conditions");
    const avoid = col(r, "avoid_conditions");
    const recommendation = col(r, "recommendation");

    if (!sp) {
      problems.push(`Line ${line}: unknown species "${col(r, "species")}". Valid names: ${species.map((s) => s.englishName).join(", ")}`);
      continue;
    }
    if (!name || name.length > 80) { problems.push(`Line ${line}: pathway name is empty or over 80 characters`); continue; }
    if (risks.length === 0 || risks.some((x) => !RISKS.includes(x))) {
      problems.push(`Line ${line}: risk levels must be LOW and/or MEDIUM, never HIGH (got "${col(r, "allowed_risk_levels")}")`);
      continue;
    }
    if (!recommendation || recommendation.length > 1000) { problems.push(`Line ${line}: recommendation is empty or over 1000 characters`); continue; }
    if (required.length > 500 || avoid.length > 500) { problems.push(`Line ${line}: conditions are over 500 characters`); continue; }

    if (!checkOnly) {
      const data = {
        allowedRisks: risks as RiskLevel[],
        requiredConditions: required,
        avoidConditions: avoid,
        recommendation,
        source: header.includes("source") ? col(r, "source") || null : null,
      };
      await prisma.pathway.upsert({
        where: { speciesId_name: { speciesId: sp.id, name } },
        update: data,
        create: { speciesId: sp.id, name, ...data },
      });
    }
    perSpecies.set(sp.englishName, (perSpecies.get(sp.englishName) ?? 0) + 1);
    ok++;
  }

  console.log(checkOnly ? `Checked: ${ok} valid row(s). Nothing was written.` : `Imported ${ok} pathway row(s).`);
  if (problems.length) {
    console.log(`\n${problems.length} row(s) skipped:`);
    problems.forEach((p) => console.log("  " + p));
  }
  console.log("\nPathways per species in this file:");
  console.table(species.map((s) => ({ species: s.englishName, pathways: perSpecies.get(s.englishName) ?? 0 })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());