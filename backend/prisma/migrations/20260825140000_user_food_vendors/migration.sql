-- Persist each user's selected food vendors (mirrors UserRestaurant), so the
-- food-vendor picker survives logout/login and app relaunch.
CREATE TABLE "UserFoodVendor" (
  "userId" TEXT NOT NULL,
  "foodVendorId" TEXT NOT NULL,
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserFoodVendor_pkey" PRIMARY KEY ("userId", "foodVendorId")
);

CREATE INDEX "UserFoodVendor_userId_idx" ON "UserFoodVendor"("userId");
CREATE INDEX "UserFoodVendor_foodVendorId_idx" ON "UserFoodVendor"("foodVendorId");

ALTER TABLE "UserFoodVendor" ADD CONSTRAINT "UserFoodVendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFoodVendor" ADD CONSTRAINT "UserFoodVendor_foodVendorId_fkey" FOREIGN KEY ("foodVendorId") REFERENCES "FoodVendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
