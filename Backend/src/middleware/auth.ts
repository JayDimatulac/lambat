import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../db";
import { verifyToken } from "../lib/jwt";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  let payload: { sub: string; iat: number };
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, status: true, passwordChangedAt: true },
  });
  if (!user || user.status === "SUSPENDED") {
    res.status(401).json({ error: "Account not available" });
    return;
  }
  // a token made before the last password change is no longer valid (compared in whole seconds)
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    res.status(401).json({ error: "Your password was changed. Please log in again." });
    return;
  }

  res.locals.auth = { userId: user.id, role: user.role };
  next();
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