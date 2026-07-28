-- AlterTable
ALTER TABLE "assembled_proposals" ADD COLUMN     "scope_data" JSONB NOT NULL DEFAULT '{}';
