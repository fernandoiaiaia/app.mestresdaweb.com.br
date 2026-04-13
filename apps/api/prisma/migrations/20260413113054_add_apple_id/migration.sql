/*
  Warnings:

  - You are about to drop the column `active` on the `loss_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `loss_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `last_used` on the `loss_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `usage_count` on the `loss_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `proposal_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `loss_reason_categories` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[proposal_id]` on the table `dev_projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[assembled_proposal_id]` on the table `dev_projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apple_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "loss_reason_categories" DROP CONSTRAINT "loss_reason_categories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "loss_reasons" DROP CONSTRAINT "loss_reasons_category_id_fkey";

-- DropIndex
DROP INDEX "loss_reasons_category_id_idx";

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "loss_reason_id" TEXT;

-- AlterTable
ALTER TABLE "dev_projects" ADD COLUMN     "assembled_proposal_id" TEXT,
ADD COLUMN     "proposal_id" TEXT;

-- AlterTable
ALTER TABLE "dev_task_comments" ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "loss_reasons" DROP COLUMN "active",
DROP COLUMN "category_id",
DROP COLUMN "last_used",
DROP COLUMN "usage_count",
ADD COLUMN     "funnel_id" TEXT,
ADD COLUMN     "stage_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "proposal_id";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "fixed_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "profit_margin" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "estimate" JSONB,
ADD COLUMN     "viewer_id" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "viewer_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowed_funnels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "apple_id" TEXT;

-- DropTable
DROP TABLE "loss_reason_categories";

-- CreateTable
CREATE TABLE "proposal_comments" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "screen_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_type" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembled_proposals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nova Proposta',
    "client_id" TEXT,
    "validity_days" INTEGER NOT NULL DEFAULT 15,
    "deal_id" TEXT,
    "public_id" TEXT,
    "viewer_id" TEXT,
    "scope_data" JSONB NOT NULL,
    "total_hours" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assembled_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_files" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profile_name" TEXT,
    "lead_id" TEXT,
    "client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_snippet" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "meta_message_id" TEXT,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT,
    "media_url" TEXT,
    "mime_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_labels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contact_labels" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_contact_labels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal_comments_proposal_id_idx" ON "proposal_comments"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_comments_screen_id_idx" ON "proposal_comments"("screen_id");

-- CreateIndex
CREATE UNIQUE INDEX "assembled_proposals_public_id_key" ON "assembled_proposals"("public_id");

-- CreateIndex
CREATE INDEX "assembled_proposals_user_id_idx" ON "assembled_proposals"("user_id");

-- CreateIndex
CREATE INDEX "assembled_proposals_viewer_id_idx" ON "assembled_proposals"("viewer_id");

-- CreateIndex
CREATE INDEX "assembled_proposals_client_id_idx" ON "assembled_proposals"("client_id");

-- CreateIndex
CREATE INDEX "assembled_proposals_deal_id_idx" ON "assembled_proposals"("deal_id");

-- CreateIndex
CREATE INDEX "knowledge_base_files_user_id_idx" ON "knowledge_base_files"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_phone_key" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_lead_id_key" ON "whatsapp_contacts"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_client_id_key" ON "whatsapp_contacts"("client_id");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_phone_idx" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_contact_id_idx" ON "whatsapp_conversations"("contact_id");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_assignee_id_idx" ON "whatsapp_conversations"("assignee_id");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_status_idx" ON "whatsapp_conversations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_meta_message_id_key" ON "whatsapp_messages"("meta_message_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversation_id_idx" ON "whatsapp_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_meta_message_id_idx" ON "whatsapp_messages"("meta_message_id");

-- CreateIndex
CREATE INDEX "whatsapp_labels_user_id_idx" ON "whatsapp_labels"("user_id");

-- CreateIndex
CREATE INDEX "whatsapp_contact_labels_contact_id_idx" ON "whatsapp_contact_labels"("contact_id");

-- CreateIndex
CREATE INDEX "whatsapp_contact_labels_label_id_idx" ON "whatsapp_contact_labels"("label_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contact_labels_contact_id_label_id_key" ON "whatsapp_contact_labels"("contact_id", "label_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_projects_proposal_id_key" ON "dev_projects"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_projects_assembled_proposal_id_key" ON "dev_projects"("assembled_proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_loss_reason_id_fkey" FOREIGN KEY ("loss_reason_id") REFERENCES "loss_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_projects" ADD CONSTRAINT "dev_projects_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_projects" ADD CONSTRAINT "dev_projects_assembled_proposal_id_fkey" FOREIGN KEY ("assembled_proposal_id") REFERENCES "assembled_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_comments" ADD CONSTRAINT "proposal_comments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembled_proposals" ADD CONSTRAINT "assembled_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembled_proposals" ADD CONSTRAINT "assembled_proposals_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembled_proposals" ADD CONSTRAINT "assembled_proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembled_proposals" ADD CONSTRAINT "assembled_proposals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_files" ADD CONSTRAINT "knowledge_base_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_labels" ADD CONSTRAINT "whatsapp_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contact_labels" ADD CONSTRAINT "whatsapp_contact_labels_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contact_labels" ADD CONSTRAINT "whatsapp_contact_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "whatsapp_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
