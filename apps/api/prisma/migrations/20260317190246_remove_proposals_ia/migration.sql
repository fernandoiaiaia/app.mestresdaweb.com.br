/*
  Warnings:

  - You are about to drop the `proposals_ia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proposals_ia" DROP CONSTRAINT "proposals_ia_user_id_fkey";

-- DropTable
DROP TABLE "proposals_ia";

-- DropEnum
DROP TYPE "ProposalIAStatus";
