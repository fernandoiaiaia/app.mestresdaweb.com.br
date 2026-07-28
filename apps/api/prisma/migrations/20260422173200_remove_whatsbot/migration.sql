/*
  Warnings:

  - You are about to drop the `chatbot_flows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatbot_knowledge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatbot_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatbot_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chatbot_templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chatbot_flows" DROP CONSTRAINT "chatbot_flows_funnel_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_flows" DROP CONSTRAINT "chatbot_flows_stage_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_flows" DROP CONSTRAINT "chatbot_flows_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_knowledge" DROP CONSTRAINT "chatbot_knowledge_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_sessions" DROP CONSTRAINT "chatbot_sessions_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_sessions" DROP CONSTRAINT "chatbot_sessions_flow_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_settings" DROP CONSTRAINT "chatbot_settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chatbot_templates" DROP CONSTRAINT "chatbot_templates_user_id_fkey";

-- DropTable
DROP TABLE "chatbot_flows";

-- DropTable
DROP TABLE "chatbot_knowledge";

-- DropTable
DROP TABLE "chatbot_sessions";

-- DropTable
DROP TABLE "chatbot_settings";

-- DropTable
DROP TABLE "chatbot_templates";
