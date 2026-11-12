-- CreateTable
CREATE TABLE "ProcessingGuide" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiresIce" BOOLEAN NOT NULL DEFAULT false,
    "allowedRisks" "RiskLevel"[],
    "equipment" TEXT[],
    "ingredients" TEXT[],
    "preparation" TEXT[],
    "steps" JSONB NOT NULL,
    "safety" TEXT[],
    "sourceTitle" TEXT NOT NULL,
    "sourceIssuer" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "sourceUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingGuide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingGuide_speciesId_product_key" ON "ProcessingGuide"("speciesId", "product");

-- AddForeignKey
ALTER TABLE "ProcessingGuide" ADD CONSTRAINT "ProcessingGuide_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
