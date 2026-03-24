-- CreateEnum
CREATE TYPE "ProposalIAStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "proposals_ia" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "status" "ProposalIAStatus" NOT NULL DEFAULT 'DRAFT',
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "platforms" JSONB NOT NULL DEFAULT '[]',
    "meeting_notes" TEXT NOT NULL DEFAULT '',
    "users" JSONB NOT NULL DEFAULT '[]',
    "modules" JSONB NOT NULL DEFAULT '[]',
    "screens" JSONB NOT NULL DEFAULT '[]',
    "features" JSONB NOT NULL DEFAULT '[]',
    "integrations" JSONB NOT NULL DEFAULT '[]',
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "estimates" JSONB NOT NULL DEFAULT '[]',
    "ai_provider" TEXT,
    "ai_model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposals_ia_user_id_idx" ON "proposals_ia"("user_id");

-- CreateIndex
CREATE INDEX "proposals_ia_status_idx" ON "proposals_ia"("status");

-- AddForeignKey
ALTER TABLE "proposals_ia" ADD CONSTRAINT "proposals_ia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
