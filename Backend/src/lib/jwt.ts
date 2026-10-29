import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing in .env");
  return secret;
}

export function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, getSecret(), {
    subject: user.id,
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): { sub: string; role: Role } {
  const payload = jwt.verify(token, getSecret()) as jwt.JwtPayload;
  return { sub: payload.sub as string, role: payload.role as Role };
}