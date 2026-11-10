import "dotenv/config";
import { z } from "zod";

export const smsEnv = z
  .object({
    SEMAPHORE_API_KEY: z.string().min(1),
    SEMAPHORE_SENDER_NAME: z.string().optional(),
    OTP_PEPPER: z.string().min(32),
    SMS_WEBHOOK_SECRET: z.string().min(24),
    SMS_DRY_RUN: z.enum(["true", "false"]).default("true"),
  })
  .parse(process.env);