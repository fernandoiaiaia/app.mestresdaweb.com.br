-- Toda entrada de lead passou a consultar os negócios do contato para garantir que só
-- exista um card aberto. A tabela tinha índice por usuário e por funil, mas não por
-- contato, então essa checagem varreria a tabela inteira a cada conversão.
CREATE INDEX "deals_client_id_idx" ON "deals"("client_id");
