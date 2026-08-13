-- CreateTable: FoodVendor (mirrors Restaurant columns)
CREATE TABLE "FoodVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "accent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FoodVendor_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Deal — restaurant now optional; add food-vendor owner + foundBy + likes/dislikes
ALTER TABLE "Deal" ALTER COLUMN "restaurantId" DROP NOT NULL;
ALTER TABLE "Deal" ADD COLUMN "foodVendorId" TEXT,
                   ADD COLUMN "foundBy" TEXT,
                   ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0,
                   ADD COLUMN "dislikes" INTEGER NOT NULL DEFAULT 0;

-- FK + index for the food-vendor owner
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_foodVendorId_fkey" FOREIGN KEY ("foodVendorId") REFERENCES "FoodVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Deal_foodVendorId_idx" ON "Deal"("foodVendorId");

-- Exactly one owner: a deal belongs to a restaurant XOR a food vendor
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_owner_chk" CHECK ((("restaurantId" IS NOT NULL)::int + ("foodVendorId" IS NOT NULL)::int) = 1);
