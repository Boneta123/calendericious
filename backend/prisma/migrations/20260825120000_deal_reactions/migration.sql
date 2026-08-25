-- Per-user reactions: one LIKE or DISLIKE per user per deal (the unique index
-- makes a second like/dislike impossible). Deal.likes/dislikes stay as cached
-- totals, adjusted transactionally by the API.
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

CREATE TABLE "DealReaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "type" "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DealReaction_userId_dealId_key" ON "DealReaction"("userId", "dealId");
CREATE INDEX "DealReaction_dealId_idx" ON "DealReaction"("dealId");

ALTER TABLE "DealReaction" ADD CONSTRAINT "DealReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealReaction" ADD CONSTRAINT "DealReaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
