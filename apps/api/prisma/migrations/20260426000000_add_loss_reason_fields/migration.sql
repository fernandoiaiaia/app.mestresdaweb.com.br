-- AlterTable
ALTER TABLE "loss_reasons" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "loss_reasons" ADD COLUMN "usage_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "loss_reasons" ADD COLUMN "last_used" TIMESTAMP(3);
