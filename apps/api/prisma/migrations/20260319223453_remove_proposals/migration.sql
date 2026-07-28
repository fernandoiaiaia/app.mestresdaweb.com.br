/*
  Warnings:

  - You are about to drop the column `proposal_count` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `proposal_id` on the `dev_projects` table. All the data in the column will be lost.
  - You are about to drop the `proposal_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proposal_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proposal_versions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proposals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dev_projects" DROP CONSTRAINT "dev_projects_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "proposal_activities" DROP CONSTRAINT "proposal_activities_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "proposal_comments" DROP CONSTRAINT "proposal_comments_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "proposal_versions" DROP CONSTRAINT "proposal_versions_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "proposals" DROP CONSTRAINT "proposals_user_id_fkey";

-- DropIndex
DROP INDEX "dev_projects_proposal_id_idx";

-- DropIndex
DROP INDEX "dev_projects_proposal_id_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "proposal_count";

-- AlterTable
ALTER TABLE "dev_projects" DROP COLUMN "proposal_id";

-- DropTable
DROP TABLE "proposal_activities";

-- DropTable
DROP TABLE "proposal_comments";

-- DropTable
DROP TABLE "proposal_versions";

-- DropTable
DROP TABLE "proposals";

-- DropEnum
DROP TYPE "HiringModel";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "ProjectType";

-- DropEnum
DROP TYPE "ProposalStatus";
