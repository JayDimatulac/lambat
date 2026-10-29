import express from "express";
import cors from "cors";
import { prisma } from "./db";

export const app = express();

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/species", async (_req, res) => {
  const species = await prisma.species.findMany({ orderBy: { englishName: "asc" } });
  res.json(species);
});