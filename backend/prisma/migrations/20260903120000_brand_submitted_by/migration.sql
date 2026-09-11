-- Track who submitted a crowdsourced brand so the per-user daily submission cap
-- (2 places/user/day, restaurants + food vendors combined) can be enforced.
-- Nullable, no FK: this is an audit/counter field, not a relation — a user
-- deletion should not cascade-delete the places they added. Indexed for the
-- "count today's submissions by this user" query.
ALTER TABLE "Restaurant" ADD COLUMN "submittedByUserId" TEXT;
ALTER TABLE "FoodVendor" ADD COLUMN "submittedByUserId" TEXT;

CREATE INDEX "Restaurant_submittedByUserId_idx" ON "Restaurant"("submittedByUserId");
CREATE INDEX "FoodVendor_submittedByUserId_idx" ON "FoodVendor"("submittedByUserId");
