-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "pendency" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");
