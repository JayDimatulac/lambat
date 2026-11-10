import express, { Router } from "express";
import { timingSafeEqual } from "crypto";
import { smsEnv } from "../config/env";
import { prisma } from "../db";
import { normalizePhPhone, mobileVariants } from "../lib/phone";
import { parseCatchSms } from "../services/smsCatch.parser";
import { sendSms } from "../services/sms.service";

const router = Router();

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// ADAPTER: map the real provider's webhook fields here once you see a real payload.
function extractInbound(body: any): { id?: string; from: string; text: string } | null {
  const from = body?.from ?? body?.sender ?? body?.msisdn;
  const text = body?.message ?? body?.text ?? body?.content;
  if (!from || !text) return null;
  return { id: body?.id ?? body?.message_id, from: String(from), text: String(text) };
}

router.post(
  "/webhook/inbound",
  express.urlencoded({ extended: false }),
  express.json(),
  async (req, res) => {
    const provided = String(req.query.token ?? req.headers["x-webhook-secret"] ?? "");
    if (!safeEq(provided, smsEnv.SMS_WEBHOOK_SECRET)) { res.sendStatus(401); return; }

    const msg = extractInbound(req.body);
    if (!msg) { res.sendStatus(400); return; }
    const sender = normalizePhPhone(msg.from);
    if (!sender) { res.sendStatus(200); return; }

    let inbox;
    try {
      inbox = await prisma.smsInbox.create({
        data: { providerMessageId: msg.id, senderNumber: sender, messageBody: msg.text },
      });
    } catch (e: any) {
      if (e.code === "P2002") { res.sendStatus(200); return; } // provider re-delivered the same message
      throw e;
    }

    const setStatus = (processingStatus: string, failureReason?: string) =>
      prisma.smsInbox.update({ where: { id: inbox.id }, data: { processingStatus, failureReason } });

    const recent = await prisma.smsInbox.count({
      where: { senderNumber: sender, receivedAt: { gt: new Date(Date.now() - 60_000) } },
    });
    if (recent > 10) { await setStatus("rejected", "rate limited"); res.sendStatus(200); return; }

    const user = await prisma.user.findFirst({ where: { mobile: { in: mobileVariants(sender) } } });
    if (!user || user.role !== "FISHERFOLK" || user.status !== "ACTIVE" || !user.mobileVerified) {
      await setStatus("rejected", "unregistered or unverified sender"); // no reply: don't pay to SMS strangers
      res.sendStatus(200);
      return;
    }

    const parsed = parseCatchSms(msg.text);
    if (!parsed.ok) {
      await setStatus("rejected", parsed.reason);
      await sendSms({
        to: sender, type: "notification",
        message: `LAMBAT: We couldn't read your message (${parsed.reason}). Please send it again from the app.`,
      });
      res.sendStatus(200);
      return;
    }
    const c = parsed.data;

    const species = await prisma.species.findFirst({
      where: {
        OR: [
          { code: { equals: c.speciesToken, mode: "insensitive" } },
          { englishName: { equals: c.speciesToken, mode: "insensitive" } },
        ],
      },
    });
    if (!species) {
      await setStatus("rejected", "unknown species");
      await sendSms({ to: sender, type: "notification", message: `LAMBAT: Unknown species "${c.speciesToken}". Please resend from the app.` });
      res.sendStatus(200);
      return;
    }

    try {
      await prisma.catchBatch.create({
        data: {
          userId: user.id,
          speciesId: species.id,
          kilos: c.kilos,
          place: c.place,
          caughtAt: c.caughtAt,
          clientRef: c.ref,
          source: "sms",
          iceEvents: { create: [{ at: c.caughtAt, iceKg: c.iceKg }] },
        },
      });
      await setStatus("processed");
      await sendSms({
        to: sender, type: "confirmation",
        message: `LAMBAT: Catch ${c.ref} received (${species.englishName}, ${c.kilos} kg).`,
      });
    } catch (e: any) {
      if (e.code === "P2002") {
        await setStatus("processed", "duplicate");
        await sendSms({ to: sender, type: "confirmation", message: `LAMBAT: Catch ${c.ref} was already received.` });
      } else {
        await setStatus("failed", "db error"); // the raw SMS stays in sms_inbox
        console.error(e);
      }
    }
    res.sendStatus(200);
  }
);

export default router;