/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SENT', 'SENT_TO_DEVS', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('WEB_SYSTEM', 'APP_MOBILE', 'WEBSITE', 'LANDING_PAGE', 'ECOMMERCE', 'DESKTOP_SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "HiringModel" AS ENUM ('FIXED', 'SQUAD', 'SPRINT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'INSTALLMENTS', 'MILESTONES');

-- CreateEnum
CREATE TYPE "DevProjectPhase" AS ENUM ('requirements', 'discovery', 'development', 'testing', 'documentation', 'delivery');

-- CreateEnum
CREATE TYPE "DevProjectHealth" AS ENUM ('on_track', 'at_risk', 'delayed');

-- CreateEnum
CREATE TYPE "DevTaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'done');

-- CreateEnum
CREATE TYPE "DevTaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "allowed_apps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip" TEXT,
    "device" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "segment" TEXT,
    "website" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "company_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "segment" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "last_contact" TIMESTAMP(3),
    "proposal_count" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_stages" (
    "id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contacts_count" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "tone" TEXT NOT NULL DEFAULT 'formal',
    "target_segment" TEXT,
    "business_hours_start" TEXT NOT NULL DEFAULT '08:00',
    "business_hours_end" TEXT NOT NULL DEFAULT '18:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "automation_level" TEXT NOT NULL DEFAULT 'semi',
    "playbook_data" JSONB,
    "persona_data" JSONB,
    "identity_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_steps" (
    "id" TEXT NOT NULL,
    "cadence_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "delay" INTEGER NOT NULL DEFAULT 0,
    "delayUnit" TEXT NOT NULL DEFAULT 'days',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "template_content" TEXT,
    "subject" TEXT,
    "stop_on_reply" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cadence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sdr_leads" (
    "id" TEXT NOT NULL,
    "consultant_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "segment" TEXT,
    "role" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "origin" TEXT,
    "status" TEXT NOT NULL DEFAULT 'novo',
    "score" INTEGER NOT NULL DEFAULT 0,
    "temperature" TEXT NOT NULL DEFAULT 'frio',
    "qualification_data" JSONB,
    "opted_out_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sdr_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_cadence_enrollments" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "cadence_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "next_action_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_cadence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_actions" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "content" TEXT,
    "ai_reasoning" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadence_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_criteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "field_type" TEXT NOT NULL DEFAULT 'boolean',
    "weight" INTEGER NOT NULL DEFAULT 0,
    "ai_prompt" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualification_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_thresholds" (
    "id" TEXT NOT NULL,
    "hot_min" INTEGER NOT NULL DEFAULT 80,
    "warm_min" INTEGER NOT NULL DEFAULT 50,
    "hot_action" TEXT NOT NULL DEFAULT 'agendar_reuniao',
    "warm_action" TEXT NOT NULL DEFAULT 'continuar_cadencia',
    "cold_action" TEXT NOT NULL DEFAULT 'pausar_cadencia',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qualification_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_meetings" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "calendar_event_id" TEXT,
    "meet_link" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "reminder_sent_1d" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_1h" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "consultant_id" TEXT,
    "title" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'low',
    "source" TEXT NOT NULL DEFAULT 'Desconhecida',
    "temperature" TEXT NOT NULL DEFAULT 'cold',
    "expected_close" TIMESTAMP(3),
    "next_action" TEXT,
    "last_activity" TEXT,
    "tags" TEXT[],
    "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadence_executions" (
    "id" TEXT NOT NULL,
    "sales_cadence_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "current_step_idx" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "next_action_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadence_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT,
    "deal_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "touch_point" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_notes" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_files" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "seniority" TEXT NOT NULL DEFAULT 'Pleno',
    "seniority_color" TEXT NOT NULL DEFAULT '#22c55e',
    "hourly_rate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cadence_steps" (
    "id" TEXT NOT NULL,
    "sales_cadence_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "template_content" TEXT,
    "subject" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_cadence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "client_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "client_id" TEXT,
    "contact_id" TEXT,
    "project_type" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadline" TEXT,
    "input_text" TEXT,
    "input_file_url" TEXT,
    "checklist" JSONB,
    "scope" JSONB,
    "estimates" JSONB,
    "hiring_model" "HiringModel",
    "payment_method" "PaymentMethod",
    "installments" INTEGER,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "commercial" JSONB,
    "review_history" JSONB DEFAULT '[]',
    "urgency" TEXT DEFAULT 'media',
    "total_hours" INTEGER,
    "total_value" DOUBLE PRECISION,
    "sent_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "public_token" TEXT,
    "recipient_emails" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_activities" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "viewer_name" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_versions" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "snapshot" JSONB NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "proposal_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_reason_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📋',
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_reason_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_reasons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internal_code" TEXT,
    "description" TEXT,
    "detailed_description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'servico',
    "category_id" TEXT NOT NULL,
    "price_min" DOUBLE PRECISION DEFAULT 0,
    "price_max" DOUBLE PRECISION DEFAULT 0,
    "billing_model" TEXT NOT NULL DEFAULT 'unico',
    "setup_fee" DOUBLE PRECISION DEFAULT 0,
    "margin_percent" DOUBLE PRECISION DEFAULT 0,
    "discount_max" DOUBLE PRECISION DEFAULT 0,
    "warranty_months" INTEGER DEFAULT 3,
    "complexity" TEXT NOT NULL DEFAULT 'medium',
    "estimated_hours" INTEGER,
    "sla_response" TEXT,
    "sla_resolution" TEXT,
    "deliverables" JSONB NOT NULL DEFAULT '[]',
    "tech_stack" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "show_in_proposals" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_types" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌐',
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utm" TEXT,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "client_count" INTEGER NOT NULL DEFAULT 0,
    "avg_ticket" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objection_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💰',
    "color" TEXT NOT NULL DEFAULT '#ef4444',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objection_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "objection" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "scripts" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "trade_name" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "tagline" TEXT,
    "about" TEXT,
    "logo_url" TEXT,
    "button_color" TEXT NOT NULL DEFAULT '#16a34a',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_conditions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entry_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validity_days" INTEGER NOT NULL DEFAULT 15,
    "methods" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_questions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "default_value" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "session_timeout" INTEGER NOT NULL DEFAULT 30,
    "min_password_length" INTEGER NOT NULL DEFAULT 8,
    "require_special_chars" BOOLEAN NOT NULL DEFAULT true,
    "require_uppercase" BOOLEAN NOT NULL DEFAULT true,
    "require_numbers" BOOLEAN NOT NULL DEFAULT true,
    "password_expiry" INTEGER NOT NULL DEFAULT 90,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "proposal_id" TEXT,
    "deal_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "global_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_start" TEXT NOT NULL DEFAULT '22:00',
    "quiet_end" TEXT NOT NULL DEFAULT '07:00',
    "digest_enabled" BOOLEAN NOT NULL DEFAULT true,
    "digest_frequency" TEXT NOT NULL DEFAULT 'daily',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "auto_backup" BOOLEAN NOT NULL DEFAULT true,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "backup_time" TEXT NOT NULL DEFAULT '03:00',
    "include_proposals" BOOLEAN NOT NULL DEFAULT true,
    "include_clients" BOOLEAN NOT NULL DEFAULT true,
    "include_config" BOOLEAN NOT NULL DEFAULT true,
    "include_users" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backup_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" TEXT NOT NULL DEFAULT '0 B',
    "type" TEXT NOT NULL DEFAULT 'Manual',
    "status" TEXT NOT NULL DEFAULT 'success',
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "file_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "portal_subdomain" TEXT NOT NULL DEFAULT '',
    "custom_domain" TEXT NOT NULL DEFAULT '',
    "domain_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT NOT NULL DEFAULT '',
    "ssl_active" BOOLEAN NOT NULL DEFAULT false,
    "whitelabel_enabled" BOOLEAN NOT NULL DEFAULT false,
    "whitelabel_name" TEXT NOT NULL DEFAULT '',
    "whitelabel_primary_color" TEXT NOT NULL DEFAULT '#10b981',
    "whitelabel_logo" TEXT,
    "whitelabel_favicon" TEXT,
    "whitelabel_footer" TEXT NOT NULL DEFAULT '',
    "whitelabel_hide_powered_by" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "user_name" TEXT NOT NULL DEFAULT 'Sistema',
    "user_role" TEXT NOT NULL DEFAULT 'Sistema',
    "target" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'system',
    "ip" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "phase" "DevProjectPhase" NOT NULL DEFAULT 'requirements',
    "health" "DevProjectHealth" NOT NULL DEFAULT 'on_track',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "hours_estimated" INTEGER NOT NULL DEFAULT 0,
    "hours_used" INTEGER NOT NULL DEFAULT 0,
    "proposal_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DevTaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "DevTaskPriority" NOT NULL DEFAULT 'medium',
    "epic" TEXT,
    "story" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "estimated_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logged_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "project_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "sprint_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_members" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DEV',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_contacts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_project_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_signatories" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_project_signatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_documents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_doc_signatures" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "signatory_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "code" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_doc_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_sprints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_task_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_task_time_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_task_time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_task_bugs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'functional',
    "priority" TEXT NOT NULL DEFAULT 'high',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reporter_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "hours_worked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attachment_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_task_bugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_task_history" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_task_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phases" JSONB NOT NULL DEFAULT '[]',
    "roles" JSONB NOT NULL DEFAULT '[]',
    "ai_rules" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_project_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "segment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_modules" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "platforms" TEXT[] DEFAULT ARRAY['Web']::TEXT[],
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_screens" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "screen_type" TEXT NOT NULL DEFAULT 'Listagem',
    "complexity_base" TEXT NOT NULL DEFAULT 'Média',
    "status" TEXT NOT NULL DEFAULT 'active',
    "platforms" TEXT[] DEFAULT ARRAY['Web']::TEXT[],
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_items" (
    "id" TEXT NOT NULL,
    "screen_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description_func" TEXT,
    "use_case" TEXT,
    "business_intent" TEXT,
    "context_triggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interface_example" TEXT,
    "tech_type" TEXT,
    "feature_pattern" TEXT,
    "complexity" TEXT NOT NULL DEFAULT 'Média',
    "algorithmic_complexity" TEXT NOT NULL DEFAULT 'baixa',
    "usage_frequency" TEXT NOT NULL DEFAULT 'Comum',
    "status" TEXT NOT NULL DEFAULT 'active',
    "platforms" TEXT[] DEFAULT ARRAY['Web']::TEXT[],
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "base_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observations" TEXT,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depends_on" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technical_components" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "external_integrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicable_segments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rates" JSONB NOT NULL DEFAULT '{}',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_codes_user_id_type_idx" ON "verification_codes"("user_id", "type");

-- CreateIndex
CREATE INDEX "verification_codes_code_idx" ON "verification_codes"("code");

-- CreateIndex
CREATE INDEX "login_logs_user_id_idx" ON "login_logs"("user_id");

-- CreateIndex
CREATE INDEX "companies_user_id_idx" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "clients_user_id_idx" ON "clients"("user_id");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_company_id_idx" ON "clients"("company_id");

-- CreateIndex
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts"("client_id");

-- CreateIndex
CREATE INDEX "funnels_user_id_idx" ON "funnels"("user_id");

-- CreateIndex
CREATE INDEX "funnel_stages_funnel_id_idx" ON "funnel_stages"("funnel_id");

-- CreateIndex
CREATE INDEX "cadences_user_id_idx" ON "cadences"("user_id");

-- CreateIndex
CREATE INDEX "cadences_status_idx" ON "cadences"("status");

-- CreateIndex
CREATE INDEX "cadence_steps_cadence_id_idx" ON "cadence_steps"("cadence_id");

-- CreateIndex
CREATE INDEX "sdr_leads_consultant_id_idx" ON "sdr_leads"("consultant_id");

-- CreateIndex
CREATE INDEX "sdr_leads_status_idx" ON "sdr_leads"("status");

-- CreateIndex
CREATE INDEX "sdr_leads_email_idx" ON "sdr_leads"("email");

-- CreateIndex
CREATE INDEX "sdr_leads_phone_idx" ON "sdr_leads"("phone");

-- CreateIndex
CREATE INDEX "sdr_leads_temperature_idx" ON "sdr_leads"("temperature");

-- CreateIndex
CREATE INDEX "lead_cadence_enrollments_lead_id_idx" ON "lead_cadence_enrollments"("lead_id");

-- CreateIndex
CREATE INDEX "lead_cadence_enrollments_cadence_id_idx" ON "lead_cadence_enrollments"("cadence_id");

-- CreateIndex
CREATE INDEX "lead_cadence_enrollments_status_idx" ON "lead_cadence_enrollments"("status");

-- CreateIndex
CREATE INDEX "lead_cadence_enrollments_next_action_at_idx" ON "lead_cadence_enrollments"("next_action_at");

-- CreateIndex
CREATE INDEX "cadence_actions_enrollment_id_idx" ON "cadence_actions"("enrollment_id");

-- CreateIndex
CREATE INDEX "cadence_actions_lead_id_idx" ON "cadence_actions"("lead_id");

-- CreateIndex
CREATE INDEX "cadence_actions_action_type_idx" ON "cadence_actions"("action_type");

-- CreateIndex
CREATE INDEX "cadence_actions_created_at_idx" ON "cadence_actions"("created_at");

-- CreateIndex
CREATE INDEX "qualification_criteria_is_active_idx" ON "qualification_criteria"("is_active");

-- CreateIndex
CREATE INDEX "scheduled_meetings_lead_id_idx" ON "scheduled_meetings"("lead_id");

-- CreateIndex
CREATE INDEX "scheduled_meetings_consultant_id_idx" ON "scheduled_meetings"("consultant_id");

-- CreateIndex
CREATE INDEX "scheduled_meetings_scheduled_at_idx" ON "scheduled_meetings"("scheduled_at");

-- CreateIndex
CREATE INDEX "scheduled_meetings_status_idx" ON "scheduled_meetings"("status");

-- CreateIndex
CREATE INDEX "deals_user_id_idx" ON "deals"("user_id");

-- CreateIndex
CREATE INDEX "deals_funnel_id_idx" ON "deals"("funnel_id");

-- CreateIndex
CREATE INDEX "sales_cadence_executions_sales_cadence_id_idx" ON "sales_cadence_executions"("sales_cadence_id");

-- CreateIndex
CREATE INDEX "sales_cadence_executions_deal_id_idx" ON "sales_cadence_executions"("deal_id");

-- CreateIndex
CREATE INDEX "sales_cadence_executions_status_next_action_at_idx" ON "sales_cadence_executions"("status", "next_action_at");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_client_id_idx" ON "tasks"("client_id");

-- CreateIndex
CREATE INDEX "tasks_deal_id_idx" ON "tasks"("deal_id");

-- CreateIndex
CREATE INDEX "deal_notes_deal_id_idx" ON "deal_notes"("deal_id");

-- CreateIndex
CREATE INDEX "deal_notes_user_id_idx" ON "deal_notes"("user_id");

-- CreateIndex
CREATE INDEX "deal_files_deal_id_idx" ON "deal_files"("deal_id");

-- CreateIndex
CREATE INDEX "professionals_user_id_idx" ON "professionals"("user_id");

-- CreateIndex
CREATE INDEX "professionals_is_active_idx" ON "professionals"("is_active");

-- CreateIndex
CREATE INDEX "integration_settings_user_id_idx" ON "integration_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_user_id_provider_key" ON "integration_settings"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "sales_cadences_stage_id_key" ON "sales_cadences"("stage_id");

-- CreateIndex
CREATE INDEX "sales_cadences_user_id_idx" ON "sales_cadences"("user_id");

-- CreateIndex
CREATE INDEX "sales_cadences_funnel_id_idx" ON "sales_cadences"("funnel_id");

-- CreateIndex
CREATE INDEX "sales_cadence_steps_sales_cadence_id_idx" ON "sales_cadence_steps"("sales_cadence_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_public_token_key" ON "proposals"("public_token");

-- CreateIndex
CREATE INDEX "proposals_user_id_idx" ON "proposals"("user_id");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposal_activities_proposal_id_idx" ON "proposal_activities"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_versions_proposal_id_idx" ON "proposal_versions"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_comments_proposal_id_screen_id_idx" ON "proposal_comments"("proposal_id", "screen_id");

-- CreateIndex
CREATE INDEX "loss_reason_categories_user_id_idx" ON "loss_reason_categories"("user_id");

-- CreateIndex
CREATE INDEX "loss_reasons_user_id_idx" ON "loss_reasons"("user_id");

-- CreateIndex
CREATE INDEX "loss_reasons_category_id_idx" ON "loss_reasons"("category_id");

-- CreateIndex
CREATE INDEX "product_categories_user_id_idx" ON "product_categories"("user_id");

-- CreateIndex
CREATE INDEX "products_user_id_idx" ON "products"("user_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "products"("type");

-- CreateIndex
CREATE INDEX "source_types_user_id_idx" ON "source_types"("user_id");

-- CreateIndex
CREATE INDEX "sources_user_id_idx" ON "sources"("user_id");

-- CreateIndex
CREATE INDEX "sources_type_id_idx" ON "sources"("type_id");

-- CreateIndex
CREATE INDEX "source_campaigns_user_id_idx" ON "source_campaigns"("user_id");

-- CreateIndex
CREATE INDEX "source_campaigns_source_id_idx" ON "source_campaigns"("source_id");

-- CreateIndex
CREATE INDEX "segments_user_id_idx" ON "segments"("user_id");

-- CreateIndex
CREATE INDEX "objection_categories_user_id_idx" ON "objection_categories"("user_id");

-- CreateIndex
CREATE INDEX "objections_user_id_idx" ON "objections"("user_id");

-- CreateIndex
CREATE INDEX "objections_category_id_idx" ON "objections"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "institutional_profiles_user_id_key" ON "institutional_profiles"("user_id");

-- CreateIndex
CREATE INDEX "payment_conditions_user_id_idx" ON "payment_conditions"("user_id");

-- CreateIndex
CREATE INDEX "checklist_categories_user_id_idx" ON "checklist_categories"("user_id");

-- CreateIndex
CREATE INDEX "checklist_questions_user_id_idx" ON "checklist_questions"("user_id");

-- CreateIndex
CREATE INDEX "checklist_questions_category_id_idx" ON "checklist_questions"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "security_settings_user_id_key" ON "security_settings"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_event_id_key" ON "notification_preferences"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "backup_settings_user_id_key" ON "backup_settings"("user_id");

-- CreateIndex
CREATE INDEX "backup_entries_user_id_created_at_idx" ON "backup_entries"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "domain_settings_user_id_key" ON "domain_settings"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_category_idx" ON "activity_logs"("category");

-- CreateIndex
CREATE UNIQUE INDEX "dev_projects_proposal_id_key" ON "dev_projects"("proposal_id");

-- CreateIndex
CREATE INDEX "dev_projects_created_by_id_idx" ON "dev_projects"("created_by_id");

-- CreateIndex
CREATE INDEX "dev_projects_proposal_id_idx" ON "dev_projects"("proposal_id");

-- CreateIndex
CREATE INDEX "dev_tasks_project_id_idx" ON "dev_tasks"("project_id");

-- CreateIndex
CREATE INDEX "dev_tasks_assignee_id_idx" ON "dev_tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "dev_tasks_sprint_id_idx" ON "dev_tasks"("sprint_id");

-- CreateIndex
CREATE INDEX "dev_tasks_status_idx" ON "dev_tasks"("status");

-- CreateIndex
CREATE INDEX "dev_project_members_project_id_idx" ON "dev_project_members"("project_id");

-- CreateIndex
CREATE INDEX "dev_project_members_user_id_idx" ON "dev_project_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_project_members_project_id_user_id_key" ON "dev_project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "dev_project_contacts_project_id_idx" ON "dev_project_contacts"("project_id");

-- CreateIndex
CREATE INDEX "dev_project_signatories_project_id_idx" ON "dev_project_signatories"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "dev_project_signatories_project_id_role_key" ON "dev_project_signatories"("project_id", "role");

-- CreateIndex
CREATE INDEX "dev_project_documents_project_id_doc_type_idx" ON "dev_project_documents"("project_id", "doc_type");

-- CreateIndex
CREATE INDEX "dev_doc_signatures_document_id_idx" ON "dev_doc_signatures"("document_id");

-- CreateIndex
CREATE INDEX "dev_sprints_project_id_idx" ON "dev_sprints"("project_id");

-- CreateIndex
CREATE INDEX "dev_task_comments_task_id_idx" ON "dev_task_comments"("task_id");

-- CreateIndex
CREATE INDEX "dev_task_time_logs_task_id_idx" ON "dev_task_time_logs"("task_id");

-- CreateIndex
CREATE INDEX "dev_task_bugs_task_id_idx" ON "dev_task_bugs"("task_id");

-- CreateIndex
CREATE INDEX "dev_task_attachments_task_id_idx" ON "dev_task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "dev_task_history_task_id_created_at_idx" ON "dev_task_history"("task_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "dev_project_settings_user_id_key" ON "dev_project_settings"("user_id");

-- CreateIndex
CREATE INDEX "feature_categories_user_id_idx" ON "feature_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_categories_user_id_slug_key" ON "feature_categories"("user_id", "slug");

-- CreateIndex
CREATE INDEX "feature_modules_category_id_idx" ON "feature_modules"("category_id");

-- CreateIndex
CREATE INDEX "feature_screens_module_id_idx" ON "feature_screens"("module_id");

-- CreateIndex
CREATE INDEX "feature_items_screen_id_idx" ON "feature_items"("screen_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_stages" ADD CONSTRAINT "funnel_stages_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadences" ADD CONSTRAINT "cadences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_steps" ADD CONSTRAINT "cadence_steps_cadence_id_fkey" FOREIGN KEY ("cadence_id") REFERENCES "cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sdr_leads" ADD CONSTRAINT "sdr_leads_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_cadence_enrollments" ADD CONSTRAINT "lead_cadence_enrollments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sdr_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_cadence_enrollments" ADD CONSTRAINT "lead_cadence_enrollments_cadence_id_fkey" FOREIGN KEY ("cadence_id") REFERENCES "cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_actions" ADD CONSTRAINT "cadence_actions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lead_cadence_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_actions" ADD CONSTRAINT "cadence_actions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sdr_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meetings" ADD CONSTRAINT "scheduled_meetings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sdr_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_meetings" ADD CONSTRAINT "scheduled_meetings_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "funnel_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadence_executions" ADD CONSTRAINT "sales_cadence_executions_sales_cadence_id_fkey" FOREIGN KEY ("sales_cadence_id") REFERENCES "sales_cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadence_executions" ADD CONSTRAINT "sales_cadence_executions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_notes" ADD CONSTRAINT "deal_notes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_notes" ADD CONSTRAINT "deal_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_files" ADD CONSTRAINT "deal_files_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_files" ADD CONSTRAINT "deal_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadences" ADD CONSTRAINT "sales_cadences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadences" ADD CONSTRAINT "sales_cadences_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadences" ADD CONSTRAINT "sales_cadences_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_cadence_steps" ADD CONSTRAINT "sales_cadence_steps_sales_cadence_id_fkey" FOREIGN KEY ("sales_cadence_id") REFERENCES "sales_cadences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_activities" ADD CONSTRAINT "proposal_activities_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_comments" ADD CONSTRAINT "proposal_comments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reason_categories" ADD CONSTRAINT "loss_reason_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loss_reasons" ADD CONSTRAINT "loss_reasons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "loss_reason_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_types" ADD CONSTRAINT "source_types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "source_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_campaigns" ADD CONSTRAINT "source_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_campaigns" ADD CONSTRAINT "source_campaigns_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objection_categories" ADD CONSTRAINT "objection_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "objection_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutional_profiles" ADD CONSTRAINT "institutional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_conditions" ADD CONSTRAINT "payment_conditions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_categories" ADD CONSTRAINT "checklist_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_questions" ADD CONSTRAINT "checklist_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_questions" ADD CONSTRAINT "checklist_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "checklist_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_settings" ADD CONSTRAINT "backup_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_entries" ADD CONSTRAINT "backup_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_settings" ADD CONSTRAINT "domain_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_projects" ADD CONSTRAINT "dev_projects_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_projects" ADD CONSTRAINT "dev_projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_tasks" ADD CONSTRAINT "dev_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_tasks" ADD CONSTRAINT "dev_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_tasks" ADD CONSTRAINT "dev_tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "dev_sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_members" ADD CONSTRAINT "dev_project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_members" ADD CONSTRAINT "dev_project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_contacts" ADD CONSTRAINT "dev_project_contacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_signatories" ADD CONSTRAINT "dev_project_signatories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_documents" ADD CONSTRAINT "dev_project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_documents" ADD CONSTRAINT "dev_project_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_doc_signatures" ADD CONSTRAINT "dev_doc_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "dev_project_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_doc_signatures" ADD CONSTRAINT "dev_doc_signatures_signatory_id_fkey" FOREIGN KEY ("signatory_id") REFERENCES "dev_project_signatories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_sprints" ADD CONSTRAINT "dev_sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_comments" ADD CONSTRAINT "dev_task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "dev_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_comments" ADD CONSTRAINT "dev_task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_time_logs" ADD CONSTRAINT "dev_task_time_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "dev_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_time_logs" ADD CONSTRAINT "dev_task_time_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_bugs" ADD CONSTRAINT "dev_task_bugs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "dev_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_bugs" ADD CONSTRAINT "dev_task_bugs_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_bugs" ADD CONSTRAINT "dev_task_bugs_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_attachments" ADD CONSTRAINT "dev_task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "dev_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_attachments" ADD CONSTRAINT "dev_task_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_history" ADD CONSTRAINT "dev_task_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "dev_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_task_history" ADD CONSTRAINT "dev_task_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_settings" ADD CONSTRAINT "dev_project_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_categories" ADD CONSTRAINT "feature_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_modules" ADD CONSTRAINT "feature_modules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "feature_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_screens" ADD CONSTRAINT "feature_screens_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "feature_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_items" ADD CONSTRAINT "feature_items_screen_id_fkey" FOREIGN KEY ("screen_id") REFERENCES "feature_screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
