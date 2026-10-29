import { Router } from "express";
import bcrypt from "bcrypt";
import type { Prisma, User } from "@prisma/client";
import { prisma } from "../db";
import { signToken } from "../lib/jwt";
import { requireAuth, requireRole } from "../middleware/auth";

export const authRouter = Router();

// 09171234567, +639171234567 and 639171234567 all become 09171234567
export function normalizeMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let m = input.replace(/[\s\-()]/g, "");
  if (m.startsWith("+63")) m = "0" + m.slice(3);
  else if (m.startsWith("63") && m.length === 12) m = "0" + m.slice(2);
  return /^09\d{9}$/.test(m) ? m : null;
}

function optional(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// role-specific details the app sends (boat, gear, address...). Must be a small plain object.
function readProfile(
  v: unknown
): { ok: true; value: Prisma.InputJsonObject | undefined } | { ok: false } {
  if (v === undefined || v === null) return { ok: true, value: undefined };
  if (typeof v !== "object" || Array.isArray(v)) return { ok: false };
  if (JSON.stringify(v).length > 2000) return { ok: false };
  return { ok: true, value: v as Prisma.InputJsonObject };
}

// never send the password hash to the browser
function publicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

authRouter.post("/register", async (req, res) => {
  const body = req.body ?? {};
  const { role, name, mobile, barangay, password } = body;

  if (role !== "FISHERFOLK" && role !== "BUYER") {
    res.status(400).json({ error: "Role must be FISHERFOLK or BUYER" });
    return;
  }
  const cleanMobile = normalizeMobile(mobile);
  if (!cleanMobile) {
    res.status(400).json({ error: "Enter a valid mobile number, like 09171234567" });
    return;
  }
  if (typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Enter your name" });
    return;
  }
  if (typeof barangay !== "string" || !barangay.trim()) {
    res.status(400).json({ error: "Enter your barangay" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const businessName = optional(body.businessName);
  if (role === "BUYER" && !businessName) {
    res.status(400).json({ error: "Enter your business name" });
    return;
  }
  const profile = readProfile(body.profile);
  if (!profile.ok) {
    res.status(400).json({ error: "Invalid profile details" });
    return;
  }

  const email = optional(body.email);

  const mobileTaken = await prisma.user.findUnique({ where: { mobile: cleanMobile } });
  if (mobileTaken) {
    res.status(409).json({ error: "This mobile number is already registered" });
    return;
  }
  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      res.status(409).json({ error: "This email is already registered" });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      role,
      status: role === "BUYER" ? "PENDING" : "ACTIVE",
      name: name.trim(),
      mobile: cleanMobile,
      email,
      barangay: barangay.trim(),
      passwordHash,
      boatOrGear: role === "FISHERFOLK" ? optional(body.boatOrGear) : null,
      fishingArea: role === "FISHERFOLK" ? optional(body.fishingArea) : null,
      businessName: role === "BUYER" ? businessName : null,
      buyerType: role === "BUYER" ? optional(body.buyerType) : null,
      profile: profile.value,
    },
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { mobile, password } = req.body ?? {};
  const cleanMobile = normalizeMobile(mobile);

  const user = cleanMobile
    ? await prisma.user.findUnique({ where: { mobile: cleanMobile } })
    : null;
  const passwordOk =
    user && typeof password === "string"
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

  if (!user || !passwordOk) {
    res.status(401).json({ error: "Wrong mobile number or password" });
    return;
  }
  if (user.status === "SUSPENDED") {
    res.status(403).json({ error: "This account is suspended" });
    return;
  }

  // a declined buyer can still log in, to read why and to apply again
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status === "SUSPENDED") {
    res.status(401).json({ error: "Account not available" });
    return;
  }
  res.json({ user: publicUser(user) });
});

// A declined buyer fixes their details and applies again
authRouter.patch("/reapply", requireAuth, requireRole("BUYER"), async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const body = req.body ?? {};

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me || me.status !== "REJECTED") {
    res.status(409).json({ error: "Only a declined application can be sent again" });
    return;
  }
  const businessName = optional(body.businessName);
  if (!businessName) {
    res.status(400).json({ error: "Enter your business name" });
    return;
  }
  const profile = readProfile(body.profile);
  if (!profile.ok) {
    res.status(400).json({ error: "Invalid profile details" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      businessName,
      buyerType: optional(body.buyerType),
      profile: profile.value,
      status: "PENDING",
      statusNote: null,
    },
  });

  res.json({ user: publicUser(updated) });
});