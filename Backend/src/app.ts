import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
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

// Render sits behind a proxy; this makes rate limiting see the real visitor address
app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: "100kb" }));

// Limit login and register attempts. Loose while developing so your tests don't trip it.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 30 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

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

// Unknown API address: answer in JSON instead of an HTML page
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Keep this last, after all routes
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});