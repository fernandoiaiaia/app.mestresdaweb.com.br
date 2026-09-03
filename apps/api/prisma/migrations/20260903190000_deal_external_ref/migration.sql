-- Cada solicitação de orçamento do Connech é uma Opportunity própria daquele lado, e a
-- Opportunity guarda `crm_deal_id` com índice único. Como a entrada de leads aqui
-- deduplica por contato, a segunda solicitação do mesmo lead devolvia o id do negócio da
-- primeira: o Connech tentava gravar um `crm_deal_id` repetido, batia no índice único e
-- marcava o evento como DEAD. A partir da segunda, a oportunidade ficava sem
-- `crm_deal_id` e o escopo publicado nunca a encontrava.
--
-- `external_ref` guarda o id da solicitação de origem para que cada uma tenha o seu
-- próprio negócio. Nulo para tudo que nasce aqui dentro (site, WhatsApp, cadastro
-- manual), que continua com a deduplicação por contato inalterada.
ALTER TABLE "deals" ADD COLUMN "external_ref" TEXT;

-- Único para tornar o reenvio da mesma solicitação idempotente: uma reentrega do webhook
-- reencontra o negócio em vez de abrir outro. Em Postgres um índice único ignora NULLs,
-- então os negócios de origem interna não disputam entre si.
CREATE UNIQUE INDEX "deals_external_ref_key" ON "deals"("external_ref");
