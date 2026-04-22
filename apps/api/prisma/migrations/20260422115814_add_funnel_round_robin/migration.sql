/*
  Warnings:

  - You are about to drop the column `scope_data` on the `assembled_proposals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assembled_proposals" DROP COLUMN "scope_data",
ADD COLUMN     "review_history" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "urgency" TEXT NOT NULL DEFAULT 'media';

-- AlterTable
ALTER TABLE "funnels" ADD COLUMN     "assignee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "last_assigned_index" INTEGER NOT NULL DEFAULT -1;
