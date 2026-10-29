import { Router } from "express";
import bcrypt from "bcrypt";
import type { User } from "@prisma/client";
import { prisma } from "../db";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// 09171234567, +639171234567 and 639171234567 all become 09171234567
function normalizeMobile(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let m = input.replace(/[\s\-()]/g, "");
  if (m.startsWith("+63")) m = "0" + m.slice(3);
  else if (m.startsWith("63") && m.length === 12) m = "0" + m.slice(2);
  return /^09\d{9}$/.test(m) ? m : null;
}

function optional(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// never send the password hash to the browser
function publicUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

authRouter.post("/register", async (req, res) => {
  const { role, name, mobile, barangay, password } = req.body ?? {};

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
  const businessName = optional(req.body.businessName);
  if (role === "BUYER" && !businessName) {
    res.status(400).json({ error: "Enter your business name" });
    return;
  }

  const email = optional(req.body.email);

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
      boatOrGear: role === "FISHERFOLK" ? optional(req.body.boatOrGear) : null,
      fishingArea: role === "FISHERFOLK" ? optional(req.body.fishingArea) : null,
      businessName: role === "BUYER" ? businessName : null,
      buyerType: role === "BUYER" ? optional(req.body.buyerType) : null,
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