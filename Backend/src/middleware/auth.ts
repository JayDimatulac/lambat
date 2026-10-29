import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    res.locals.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

export function requireRole(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const auth = res.locals.auth as { role: Role } | undefined;
    if (!auth || !roles.includes(auth.role)) {
      res.status(403).json({ error: "You don't have access to this" });
      return;
    }
    next();
  };
}