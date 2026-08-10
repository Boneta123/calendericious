-- AlterEnum
ALTER TYPE "DealCategory" ADD VALUE 'BIRTHDAY';

-- CreateEnum
CREATE TYPE "BirthdayWindow" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- AlterTable: replace User.zip with User.birthday ("MM-DD", nullable)
ALTER TABLE "User" DROP COLUMN "zip";
ALTER TABLE "User" ADD COLUMN "birthday" TEXT;

-- AlterTable: BIRTHDAY deals carry a display window around the user's birthday
ALTER TABLE "Deal" ADD COLUMN "birthdayWindow" "BirthdayWindow";
