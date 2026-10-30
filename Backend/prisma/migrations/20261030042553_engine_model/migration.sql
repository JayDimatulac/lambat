/*
  Warnings:

  - You are about to drop the column `iceSacks` on the `CatchBatch` table. All the data in the column will be lost.
  - You are about to drop the column `shelfLifeHoursAt0C` on the `Species` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Species` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CatchBatch" DROP COLUMN "iceSacks",
ADD COLUMN     "place" TEXT;

-- AlterTable
ALTER TABLE "Species" DROP COLUMN "shelfLifeHoursAt0C",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "histamine" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "l0Max" INTEGER,
ADD COLUMN     "l0Min" INTEGER;

-- CreateTable
CREATE TABLE "IceEvent" (
    "id" TEXT NOT NULL,
    "catchId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "iceKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IceEvent_catchId_at_idx" ON "IceEvent"("catchId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "Species_code_key" ON "Species"("code");

-- AddForeignKey
ALTER TABLE "IceEvent" ADD CONSTRAINT "IceEvent_catchId_fkey" FOREIGN KEY ("catchId") REFERENCES "CatchBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
