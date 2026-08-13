-- Link each deal to the user who created it (null for scraped/anonymous).
ALTER TABLE "Deal" ADD COLUMN "foundByUserId" TEXT;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_foundByUserId_fkey" FOREIGN KEY ("foundByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Deal_foundByUserId_idx" ON "Deal"("foundByUserId");
