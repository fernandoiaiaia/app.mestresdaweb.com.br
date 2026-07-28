-- CreateTable
CREATE TABLE "chatbot_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "persona" TEXT NOT NULL DEFAULT 'Você é um assistente comercial profissional e amigável.',
    "welcome_message" TEXT,
    "transfer_message" TEXT NOT NULL DEFAULT 'Vou transferir você para um de nossos especialistas. Aguarde um momento!',
    "business_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "business_hours" JSONB,
    "off_hours_message" TEXT NOT NULL DEFAULT 'Obrigado pelo contato! Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Retornaremos em breve!',
    "max_messages_per_session" INTEGER NOT NULL DEFAULT 30,
    "embed_enabled" BOOLEAN NOT NULL DEFAULT false,
    "embed_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_flows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'inbound',
    "system_prompt" TEXT NOT NULL DEFAULT '',
    "qualification_fields" JSONB NOT NULL DEFAULT '[]',
    "auto_create_deal" BOOLEAN NOT NULL DEFAULT true,
    "move_to_stage_id" TEXT,
    "outbound_trigger" TEXT NOT NULL DEFAULT 'manual',
    "outbound_template_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_sessions" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "collected_data" JSONB NOT NULL DEFAULT '{}',
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "deal_id" TEXT,
    "transferred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_knowledge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meta_template_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "language" TEXT NOT NULL DEFAULT 'pt_BR',
    "body_text" TEXT NOT NULL,
    "header_text" TEXT,
    "footer_text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_settings_user_id_key" ON "chatbot_settings"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_flows_user_id_idx" ON "chatbot_flows"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_flows_funnel_id_idx" ON "chatbot_flows"("funnel_id");

-- CreateIndex
CREATE INDEX "chatbot_flows_stage_id_idx" ON "chatbot_flows"("stage_id");

-- CreateIndex
CREATE INDEX "chatbot_sessions_flow_id_idx" ON "chatbot_sessions"("flow_id");

-- CreateIndex
CREATE INDEX "chatbot_sessions_conversation_id_idx" ON "chatbot_sessions"("conversation_id");

-- CreateIndex
CREATE INDEX "chatbot_sessions_status_idx" ON "chatbot_sessions"("status");

-- CreateIndex
CREATE INDEX "chatbot_knowledge_user_id_idx" ON "chatbot_knowledge"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_templates_user_id_idx" ON "chatbot_templates"("user_id");

-- CreateIndex
CREATE INDEX "chatbot_templates_status_idx" ON "chatbot_templates"("status");

-- AddForeignKey
ALTER TABLE "chatbot_settings" ADD CONSTRAINT "chatbot_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_flows" ADD CONSTRAINT "chatbot_flows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_flows" ADD CONSTRAINT "chatbot_flows_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_flows" ADD CONSTRAINT "chatbot_flows_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "chatbot_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_knowledge" ADD CONSTRAINT "chatbot_knowledge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_templates" ADD CONSTRAINT "chatbot_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
