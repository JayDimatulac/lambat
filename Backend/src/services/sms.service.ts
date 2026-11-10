import { smsEnv } from "../config/env";
import { prisma } from "../db";
import { toGatewayFormat } from "../lib/phone";

type SmsType = "otp" | "confirmation" | "notification";

export async function sendSms(p: { to: string; message: string; type: SmsType }): Promise<boolean> {
  let status: "sent" | "failed" = "sent";
  let providerId: string | undefined;

  if (smsEnv.SMS_DRY_RUN === "true") {
    console.log(`[SMS DRY RUN] to=${p.to} type=${p.type}\n${p.message}`);
  } else {
    try {
      const body = new URLSearchParams({
        apikey: smsEnv.SEMAPHORE_API_KEY,
        number: toGatewayFormat(p.to),
        message: p.message,
      });
      if (smsEnv.SEMAPHORE_SENDER_NAME) body.set("sendername", smsEnv.SEMAPHORE_SENDER_NAME);
      const res = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* not JSON */ }

      if (!res.ok || !Array.isArray(data) || !data[0]?.message_id) {
        console.error("[SMS FAILED]", res.status, text);
        status = "failed";
      } else {
        providerId = String(data[0].message_id);
        console.log("[SMS SENT]", p.type, "to", p.to, "status:", data[0].status);
      }
    } catch (e) {
      console.error("[SMS ERROR]", e);
      status = "failed";
    }
  }

  await prisma.smsLog.create({
    data: { recipient: p.to, messageType: p.type, providerMessageId: providerId, status },
  });
  return status === "sent";
}