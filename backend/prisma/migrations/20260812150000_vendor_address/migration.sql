-- Persist the street address that crowdsourced submissions collect.
ALTER TABLE "Restaurant" ADD COLUMN "address" TEXT;
ALTER TABLE "FoodVendor" ADD COLUMN "address" TEXT;
