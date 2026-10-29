import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { prisma } from "./db";
import { authRouter } from "./routes/auth";
import { catchesRouter } from "./routes/catches";
import { adminRouter } from "./routes/admin";
import { weatherRouter } from "./routes/weather";
import { advisoriesRouter } from "./routes/advisories";
import { notificationsRouter } from "./routes/notifications";
import { needsRouter } from "./routes/needs";
import { offersRouter } from "./routes/offers";
import { ordersRouter } from "./routes/orders";

export const app = express();

app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("LAMBAT API is running. Try /api/health or /api/species");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/species", async (_req, res) => {
  const species = await prisma.species.findMany({ orderBy: { englishName: "asc" } });
  res.json(species);
});

app.use("/api/auth", authRouter);
app.use("/api/catches", catchesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/advisories", advisoriesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/needs", needsRouter);
app.use("/api/offers", offersRouter);
app.use("/api/orders", ordersRouter);

// Keep this last, after all routes
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});