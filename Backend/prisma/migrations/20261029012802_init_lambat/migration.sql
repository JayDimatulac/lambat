-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FISHERFOLK', 'BUYER', 'ADMIN', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CatchStatus" AS ENUM ('ACTIVE', 'SOLD', 'REDISTRIBUTED', 'PROCESSED', 'DISCARDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "boatOrGear" TEXT,
    "fishingArea" TEXT,
    "businessName" TEXT,
    "buyerType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "localNames" TEXT[],
    "shelfLifeHoursAt0C" INTEGER,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "kilos" DOUBLE PRECISION NOT NULL,
    "iceSacks" DOUBLE PRECISION,
    "caughtAt" TIMESTAMP(3) NOT NULL,
    "status" "CatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatchBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Species_englishName_key" ON "Species"("englishName");

-- CreateIndex
CREATE INDEX "CatchBatch_userId_idx" ON "CatchBatch"("userId");

-- CreateIndex
CREATE INDEX "CatchBatch_speciesId_idx" ON "CatchBatch"("speciesId");

-- AddForeignKey
ALTER TABLE "CatchBatch" ADD CONSTRAINT "CatchBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchBatch" ADD CONSTRAINT "CatchBatch_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
