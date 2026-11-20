// Builds prisma/pathways.csv from the pathway rules in the frontend (frontend/src/lib/pathways.ts).
// Run from Backend:  npx ts-node --transpile-only prisma/pathways-from-frontend.ts
import fs from "fs";
import path from "path";
import ts from "typescript";

// The frontend is an ES-module project, so Node cannot require its file directly.
// Instead we read pathways.ts, turn it into plain JavaScript in memory, and run that.
const srcFile = path.join(__dirname, "..", "..", "frontend", "src", "lib", "pathways.ts");
const js = ts.transpileModule(fs.readFileSync(srcFile, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod: { exports: any } = { exports: {} };
new Function("exports", "module", "require", js)(mod.exports, mod, require);
const PATHWAYS: {
  id: string; species: string[]; name: string; allowed: string[];
  conditions: string[]; avoid: string[]; wording: string; source: string;
}[] = mod.exports.PATHWAYS;

// frontend species id -> the englishName used in the Species table
const NAMES: Record<string, string> = {
  roughear: "Roughear scad",
  shortfin: "Shortfin scad",
  mackerelScad: "Mackerel scad",
  bigeye: "Bigeye scad",
  bali: "Bali sardinella",
  islandMackerel: "Island mackerel",
  bullet: "Bullet tuna",
  yellowfin: "Yellowfin tuna",
  skipjack: "Skipjack tuna",
  moonfish: "Moonfish",
};

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
const risk = (r: string) => (r === "low" ? "LOW" : r === "moderate" ? "MEDIUM" : "");

const lines = ["species,allowed_risk_levels,pathway,required_conditions,avoid_conditions,recommendation,source"];
const seen = new Set<string>();
for (const p of PATHWAYS) {
  const risks = p.allowed.map(risk).filter(Boolean).join("|");
  for (const id of p.species) {
    const english = NAMES[id];
    if (!english) { console.warn(`skipped: unknown species id "${id}" in ${p.id}`); continue; }
    const key = `${english}|${p.name}`;
    if (seen.has(key)) { console.warn(`skipped duplicate: ${english} / ${p.name} (${p.id})`); continue; }
    seen.add(key);
    lines.push([english, risks, p.name, p.conditions.join("; "), p.avoid.join("; "), p.wording, p.source || "To verify"].map(q).join(","));
  }
}
const out = path.join(__dirname, "pathways.csv");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${lines.length - 1} row(s) to prisma\\pathways.csv`);