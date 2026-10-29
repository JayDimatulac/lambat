-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile" JSONB,
ADD COLUMN     "statusNote" TEXT;
