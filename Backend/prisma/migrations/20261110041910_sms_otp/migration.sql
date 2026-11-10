/*
  Warnings:

  - A unique constraint covering the columns `[userId,clientRef]` on the table `CatchBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CatchBatch" ADD COLUMN     "clientRef" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'api';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "user_id" TEXT,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_inbox" (
    "id" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "sender_number" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,

    CONSTRAINT "sms_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_phone_purpose_created_at_idx" ON "otp_codes"("phone", "purpose", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reset_tokens_token_hash_key" ON "reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "sms_inbox_provider_message_id_key" ON "sms_inbox"("provider_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "CatchBatch_userId_clientRef_key" ON "CatchBatch"("userId", "clientRef");
