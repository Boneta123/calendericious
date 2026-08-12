-- AlterEnum: remove 'REWARDS' from DealCategory (Postgres can't DROP an enum
-- value, so recreate the type without it). Safe — no Deal rows use 'REWARDS'.
BEGIN;
CREATE TYPE "DealCategory_new" AS ENUM ('DAY', 'TIME', 'LIMITED_TIME', 'BIRTHDAY');
ALTER TABLE "Deal" ALTER COLUMN "category" TYPE "DealCategory_new" USING ("category"::text::"DealCategory_new");
ALTER TYPE "DealCategory" RENAME TO "DealCategory_old";
ALTER TYPE "DealCategory_new" RENAME TO "DealCategory";
DROP TYPE "DealCategory_old";
COMMIT;
