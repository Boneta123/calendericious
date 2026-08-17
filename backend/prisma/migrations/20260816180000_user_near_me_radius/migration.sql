-- Persist each user's chosen "Near me" radius (miles) so it restores with their
-- session across launches and devices. Defaults to 25.
ALTER TABLE "User" ADD COLUMN "nearMeRadius" INTEGER NOT NULL DEFAULT 25;
