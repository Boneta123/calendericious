-- Coordinates for user-added local spots (from the picked place), so "Near me"
-- can filter by real distance to the device. Admin chains leave these null.
ALTER TABLE "Restaurant" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "Restaurant" ADD COLUMN "lng" DOUBLE PRECISION;
ALTER TABLE "FoodVendor" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "FoodVendor" ADD COLUMN "lng" DOUBLE PRECISION;
