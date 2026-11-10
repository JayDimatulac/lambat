import bcrypt from "bcrypt";
import { Router } from "express";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { normalizePhPhone, mobileVariants } from "../lib/phone";
import { issueOtp, verifyOtp } from "../services/otp.service";

const router = Router();
router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "production" ? 40 : 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

const ah = (fn: RequestHandler): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const mobile = z.string().max(20).transform((v, ctx) => {
  const n = normalizePhPhone(v);
  if (!n) {
    ctx.addIssue({ code: "custom", message: "Invalid PH mobile number" });
    return z.NEVER;
  }
  return n;
});
const code = z.string().regex(/^\d{6}$/);

const GENERIC = { ok: true, message: "If the number is eligible, a code has been sent." };
const BAD_CODE = { error: "Invalid or expired code" };
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// ---- Verify the logged-in user's own mobile number ----
router.post("/send-mobile-verification", requireAuth, ah(async (_req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mobile: true } });
  const phone = user ? normalizePhPhone(user.mobile) : null;
  if (!phone) {
    res.status(400).json({ error: "Your saved mobile number isn't a valid PH number" });
    return;
  }
  const r = await issueOtp(phone, "verify", userId);
  if (r === "cooldown") { res.status(429).json({ error: "Please wait 60 seconds before asking for another code" }); return; }
  if (r === "limited") { res.status(429).json({ error: "Too many codes requested. Try again in an hour." }); return; }
  if (r === "failed") { res.status(502).json({ error: "Couldn't send the SMS. Please try again." }); return; }
  res.json({ ok: true });
}));

router.post("/verify-mobile", requireAuth, ah(async (req, res) => {
  const { userId } = res.locals.auth as { userId: string };
  const { code: c } = z.object({ code }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mobile: true } });
  const phone = user ? normalizePhPhone(user.mobile) : null;
  if (!phone) { res.status(400).json(BAD_CODE); return; }
  const r = await verifyOtp(phone, "verify", c);
  if (!r.ok || r.userId !== userId) { res.status(400).json(BAD_CODE); return; }
  await prisma.user.update({ where: { id: userId }, data: { mobileVerified: true } });
  res.json({ ok: true });
}));

// ---- Forgot password ----
router.post("/forgot-password", ah(async (req, res) => {
  const { mobile: phone } = z.object({ mobile }).parse(req.body);
  const user = await prisma.user.findFirst({
    where: { mobile: { in: mobileVariants(phone) }, status: { not: "SUSPENDED" } },
    select: { id: true },
  });
  if (user) void issueOtp(phone, "reset", user.id).catch(console.error); // not awaited: same response time either way
  res.json(GENERIC);
}));

router.post("/forgot-password/verify", ah(async (req, res) => {
  const b = z.object({ mobile, code }).parse(req.body);
  const r = await verifyOtp(b.mobile, "reset", b.code);
  if (!r.ok || !r.userId) { res.status(400).json(BAD_CODE); return; }

  await prisma.user.update({ where: { id: r.userId }, data: { mobileVerified: true } });
  const raw = randomBytes(32).toString("base64url");
  await prisma.resetToken.create({
    data: { tokenHash: sha256(raw), userId: r.userId, expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  res.json({ resetToken: raw }); // one-time reset authorization (used by /reset-password, coming next)
}));

// ---- Forgot password, step 3: set the new password ----
router.post("/reset-password", ah(async (req, res) => {
  const b = z.object({
    resetToken: z.string().min(20).max(100),
    newPassword: z.string().min(8).max(72),
  }).parse(req.body);

  const BAD = { error: "This reset request is invalid or has expired. Please start again." };
  const tokenHash = sha256(b.resetToken);

  const t = await prisma.resetToken.findUnique({ where: { tokenHash } });
  if (!t) { res.status(400).json(BAD); return; }

  // claim the token atomically so it can only be used once
  const claimed = await prisma.resetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) { res.status(400).json(BAD); return; }

  await prisma.user.update({
    where: { id: t.userId },
    data: {
      passwordHash: await bcrypt.hash(b.newPassword, 10),
      passwordChangedAt: new Date(), // your requireAuth rejects every older token
    },
  });
  res.json({ ok: true });
}));

export default router;