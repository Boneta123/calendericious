-- Website is the brand key: enforce uniqueness so the same place can't be
-- submitted twice (by a user, or after I add it in the admin). Both tables are
-- empty at apply time, so this is safe.
CREATE UNIQUE INDEX "Restaurant_url_key" ON "Restaurant"("url");
CREATE UNIQUE INDEX "FoodVendor_url_key" ON "FoodVendor"("url");
