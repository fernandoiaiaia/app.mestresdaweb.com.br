/*
  Warnings:

  - You are about to drop the column `ai_provider` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `confidence_breakdown` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `confidence_score` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `diagnostic` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `gaps` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `platforms_ia` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `project_name` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `raw_input_text` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `review_data` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `selected_features` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `selected_modules` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `selected_screens` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `system_type` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the column `wizard_step` on the `proposals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "proposals" DROP COLUMN "ai_provider",
DROP COLUMN "confidence_breakdown",
DROP COLUMN "confidence_score",
DROP COLUMN "diagnostic",
DROP COLUMN "gaps",
DROP COLUMN "platforms_ia",
DROP COLUMN "project_name",
DROP COLUMN "raw_input_text",
DROP COLUMN "review_data",
DROP COLUMN "selected_features",
DROP COLUMN "selected_modules",
DROP COLUMN "selected_screens",
DROP COLUMN "system_type",
DROP COLUMN "wizard_step";
