-- Fusão de contatos duplicados sem remover registro. O contato repetido passa a apontar
-- para o que ficou, em vez de ser excluído: nenhum lead sai da base, a fusão fica
-- auditável e é reversível. Listagens e deduplicação ignoram quem tem este campo preenchido.
ALTER TABLE "clients" ADD COLUMN "merged_into_id" TEXT;

CREATE INDEX "clients_merged_into_id_idx" ON "clients"("merged_into_id");
