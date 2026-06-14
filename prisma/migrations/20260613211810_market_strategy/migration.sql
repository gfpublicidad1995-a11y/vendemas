-- CreateTable
CREATE TABLE "MarketStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "brandDna" JSONB,
    "avatar" JSONB,
    "offer" JSONB,
    "competitors" JSONB,
    "sevenSuitcases" JSONB,
    "dominantAwarenessLevel" TEXT NOT NULL DEFAULT 'problem',
    "awarenessMap" JSONB,
    "scriptGuide" JSONB,
    "creativeMatrix" JSONB,
    "budgetCalc" JSONB,
    "campaignStructure" JSONB,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketStrategy_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketStrategy_businessProfileId_key" ON "MarketStrategy"("businessProfileId");
