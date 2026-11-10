import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { smsEnv } from "../config/env";
import { prisma } from "../db";
import { sendSms } from "./sms.service";

type Purpose = "register" | "verify" | "login" | "reset";

const TTL_MS = 5 * 60_000;      // expires in 5 min
const COOLDOWN_MS = 60_000;     // 60 s between sends
const MAX_ATTEMPTS = 5;         // per code
const MAX_PER_HOUR = 5;         // per phone, caps SMS cost

const hash = (id: string, code: string) =>
  createHmac("sha256", smsEnv.OTP_PEPPER).update(`${id}:${code}`).digest("hex");

export async function issueOtp(phone: string, purpose: Purpose, userId?: string) {
  const now = Date.now();

  const last = await prisma.otpCode.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (last && now - last.createdAt.getTime() < COOLDOWN_MS) return "cooldown" as const;

  const hourly = await prisma.otpCode.count({
    where: { phone, createdAt: { gt: new Date(now - 3_600_000) } },
  });
  if (hourly >= MAX_PER_HOUR) return "limited" as const;

  await prisma.otpCode.updateMany({
    where: { phone, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const id = randomUUID();
  await prisma.otpCode.create({
    data: { id, phone, purpose, userId, codeHash: hash(id, code), expiresAt: new Date(now + TTL_MS) },
  });

  const ok = await sendSms({
    to: phone,
    type: "otp",
    message: `LAMBAT: Your verification code is ${code}. It expires in 5 minutes. Never share this code.`,
  });
  return ok ? ("sent" as const) : ("failed" as const);
}

export async function verifyOtp(phone: string, purpose: Purpose, code: string) {
  const rec = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!rec || rec.expiresAt < new Date() || rec.attempts >= MAX_ATTEMPTS) return { ok: false as const };

  // count the attempt first, atomically, so parallel guesses can't sneak past the limit
  const bumped = await prisma.otpCode.updateMany({
    where: { id: rec.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (bumped.count === 0) return { ok: false as const };

  const a = Buffer.from(hash(rec.id, code));
  const b = Buffer.from(rec.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false as const };

  const used = await prisma.otpCode.updateMany({
    where: { id: rec.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return used.count === 1
    ? { ok: true as const, userId: rec.userId ?? undefined }
    : { ok: false as const };
}