-- Add assignee_ids column to deals to support multiple assignees
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "assignee_ids" TEXT[] NOT NULL DEFAULT '{}';
