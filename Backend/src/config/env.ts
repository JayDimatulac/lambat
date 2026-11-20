import "dotenv/config";
import { z } from "zod";

export const smsEnv = z
  .object({
    // only needed when real SMS is switched on (SMS_DRY_RUN=false)
    SEMAPHORE_API_KEY: z.string().optional(),
    SEMAPHORE_SENDER_NAME: z.string().optional(),
    OTP_PEPPER: z.string().min(32),
    SMS_WEBHOOK_SECRET: z.string().min(24),
    // safe default: if the variable is forgotten, nothing is sent and nothing is charged
    SMS_DRY_RUN: z.enum(["true", "false"]).default("true"),
  })
  .refine((e) => e.SMS_DRY_RUN === "true" || !!e.SEMAPHORE_API_KEY, {
    message: "SEMAPHORE_API_KEY is required when SMS_DRY_RUN=false",
    path: ["SEMAPHORE_API_KEY"],
  })
  .parse(process.env);