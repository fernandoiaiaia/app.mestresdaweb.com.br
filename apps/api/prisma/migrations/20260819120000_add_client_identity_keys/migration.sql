-- Chaves canônicas de identidade do contato, base da deduplicação de leads em todos os
-- canais de entrada (formulários do site, webhook inbound, WhatsApp, importação, CRM).
-- A aplicação grava estas colunas via src/lib/contact-identity.ts; o backfill abaixo
-- aplica exatamente a mesma regra aos registros já existentes.

ALTER TABLE "clients" ADD COLUMN "email_key" TEXT;
ALTER TABLE "clients" ADD COLUMN "phone_key" TEXT;

-- E-mail: trim + caixa baixa. Vazio conta como ausente.
UPDATE "clients"
SET "email_key" = NULLIF(lower(btrim("email")), '')
WHERE "email" IS NOT NULL;

-- Telefone: espelho SQL de phoneIdentityKey().
--   1. mantém só dígitos e descarta prefixo internacional "00";
--   2. separa DDI 55 quando presente, obtendo o número nacional;
--   3. reconstrói o nono dígito de celular no formato legado (8 dígitos iniciando em 6-9);
--   4. só assume Brasil quando o resultado tem forma brasileira válida — caso contrário
--      um número estrangeiro longo vira chave exata e um número curto fica sem chave.
WITH digits AS (
    SELECT "id", regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') AS d
    FROM "clients"
    WHERE "phone" IS NOT NULL
),
stripped AS (
    SELECT "id",
           CASE WHEN d LIKE '00%' AND length(d) >= 12 THEN substring(d FROM 3) ELSE d END AS d
    FROM digits
),
national AS (
    SELECT "id", d,
           CASE
               WHEN d LIKE '55%' AND length(d) IN (12, 13) THEN substring(d FROM 3)
               WHEN length(d) IN (10, 11) THEN d
               ELSE NULL
           END AS nat
    FROM stripped
),
expanded AS (
    SELECT "id", d,
           substring(nat FROM 1 FOR 2) AS ddd,
           CASE
               WHEN length(substring(nat FROM 3)) = 8 AND substring(nat FROM 3) ~ '^[6-9]'
                   THEN '9' || substring(nat FROM 3)
               ELSE substring(nat FROM 3)
           END AS sub
    FROM national
)
UPDATE "clients" c
SET "phone_key" = CASE
    -- DDD válido é 11..99; '^[1-9][0-9]$' deixaria passar o 10 e inventaria um celular.
    WHEN e.ddd ~ '^(1[1-9]|[2-9][0-9])$'
     AND (
         (length(e.sub) = 9 AND e.sub LIKE '9%')
         OR (length(e.sub) = 8 AND e.sub ~ '^[2-5]')
     )
        THEN '55' || e.ddd || e.sub
    WHEN length(e.d) >= 11 THEN e.d
    ELSE NULL
END
FROM expanded e
WHERE c."id" = e."id";

CREATE INDEX "clients_user_id_email_key_idx" ON "clients"("user_id", "email_key");
CREATE INDEX "clients_user_id_phone_key_idx" ON "clients"("user_id", "phone_key");
