import { timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

// For the scheduled job only. The caller must send the header  x-cron-secret: <CRON_SECRET>.
// If CRON_SECRET is not set on the server, the job is switched off.
export function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.CRON_SECRET ?? "";
  if (expected.length < 24) {
    res.status(503).json({ error: "Scheduled jobs are not set up on this server" });
    return;
  }

  const sent = String(req.headers["x-cron-secret"] ?? "");
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: "Not allowed" });
    return;
  }
  next();
}