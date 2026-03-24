// ═══════════════════════════════════════
// Integrations — Shared Data & Types
// ═══════════════════════════════════════

import {
    Zap, Mail, MessageSquare, CreditCard, Cloud, Calendar,
    BarChart3, Database, FileText, Phone, Webhook, GitBranch,
    Boxes, Truck, Globe, Shield, BellRing, Users, Receipt,
} from "lucide-react";

let _c = 0;
const uid = () => "gen-" + (++_c).toString(36);

/* ═══ Integration Type ═══ */

export interface Integration {
    id: string;
    name: string;
    description: string;
    icon: any;
    category: string;
    status: "connected" | "disconnected" | "coming_soon";
    lastSync: string | null;
    details: string;
    apiKey?: string;
    webhookUrl?: string;
    configFields?: { label: string; key: string; placeholder: string; value: string }[];
}

/* ═══ All Integrations ═══ */

export const initialIntegrations: Integration[] = [
    // ═══ PROPOSTAS ═══
    { id: "proposal_openai", name: "OpenAI (Propostas)", description: "Motor de IA para geração automática de checklists, escopos e estimativas de projetos.", icon: Zap, category: "Propostas", status: "disconnected", lastSync: null, details: "GPT-4 Turbo · Geração inteligente", configFields: [{ label: "API Key", key: "apiKey", placeholder: "sk-proj-...", value: "" }, { label: "Modelo", key: "model", placeholder: "gpt-4-turbo", value: "gpt-4-turbo" }, { label: "Max Tokens", key: "maxTokens", placeholder: "4096", value: "4096" }, { label: "Temperature", key: "temperature", placeholder: "0.7", value: "0.7" }] },
    { id: "proposal_brevo", name: "Brevo (Propostas)", description: "Envio de propostas por e-mail com template profissional e link de acesso público via Brevo.", icon: Mail, category: "Propostas", status: "disconnected", lastSync: null, details: "E-mail transacional para propostas", configFields: [{ label: "API Key", key: "apiKey", placeholder: "xkeysib-...", value: "" }, { label: "E-mail Remetente", key: "fromEmail", placeholder: "propostas@suaempresa.com", value: "" }, { label: "Nome Remetente", key: "fromName", placeholder: "Equipe Comercial", value: "" }] },
    { id: "proposal_minimax", name: "MiniMax M2.5 (Propostas)", description: "Motor de IA da MiniMax para geração de escopos, módulos, telas e funcionalidades nas propostas. Modelo M2.5 com contexto de 1M tokens.", icon: Zap, category: "Propostas", status: "disconnected", lastSync: null, details: "MiniMax M2.5 · 1M token context", configFields: [{ label: "API Key", key: "apiKey", placeholder: "sk-minimax-...", value: "" }, { label: "Group ID", key: "groupId", placeholder: "grupo_id_da_conta", value: "" }, { label: "Modelo", key: "model", placeholder: "MiniMax-M2.5", value: "MiniMax-M2.5" }, { label: "Max Tokens", key: "maxTokens", placeholder: "8192", value: "8192" }] },
    { id: "proposal_whisper", name: "Whisper (Transcrição)", description: "Transcrição automática de áudios e vídeos de reuniões para alimentar as propostas.", icon: Zap, category: "Propostas", status: "disconnected", lastSync: null, details: "OpenAI Whisper · Transcrição em PT-BR", configFields: [{ label: "API Key", key: "apiKey", placeholder: "sk-proj-...", value: "" }, { label: "Modelo", key: "model", placeholder: "whisper-1", value: "whisper-1" }] },
    { id: "proposal_pdf", name: "PDF Generator", description: "Geração automática de PDFs profissionais das propostas para envio e download.", icon: FileText, category: "Propostas", status: "connected", lastSync: "Automático", details: "Puppeteer · Sem credenciais necessárias" },
    // ═══ SDR AUTOMÁTICO ═══
    { id: "sdr_anthropic", name: "Anthropic (Claude IA)", description: "Motor de IA para personalização de mensagens, qualificação de leads e análise de respostas.", icon: Zap, category: "SDR Automático", status: "disconnected", lastSync: null, details: "Model: claude-sonnet-4-20250514 · IA para SDR", configFields: [{ label: "API Key", key: "apiKey", placeholder: "sk-ant-api03-...", value: "" }, { label: "Modelo", key: "model", placeholder: "claude-sonnet-4-20250514", value: "claude-sonnet-4-20250514" }, { label: "Max Tokens", key: "maxTokens", placeholder: "4096", value: "4096" }] },
    { id: "sdr_brevo", name: "Brevo (E-mail)", description: "Envio de e-mails automatizados para prospecção, follow-up e rastreamento de aberturas/cliques via Brevo.", icon: Mail, category: "SDR Automático", status: "disconnected", lastSync: null, details: "API de e-mail transacional Brevo", configFields: [{ label: "API Key", key: "apiKey", placeholder: "xkeysib-...", value: "" }, { label: "E-mail Remetente", key: "fromEmail", placeholder: "sdr@suaempresa.com", value: "" }, { label: "Nome Remetente", key: "fromName", placeholder: "Equipe Comercial", value: "" }] },
    { id: "sdr_whatsapp", name: "WhatsApp Business (Meta)", description: "Envio de mensagens de prospecção e follow-up via WhatsApp com templates aprovados pela Meta.", icon: MessageSquare, category: "SDR Automático", status: "disconnected", lastSync: null, details: "API Cloud da Meta", configFields: [{ label: "Access Token", key: "accessToken", placeholder: "EAAx...", value: "" }, { label: "Phone Number ID", key: "phoneNumberId", placeholder: "1234567890", value: "" }, { label: "Business Account ID", key: "businessAccountId", placeholder: "987654321", value: "" }, { label: "Verify Token (Webhook)", key: "verifyToken", placeholder: "seu_token_secreto", value: "" }] },
    { id: "sdr_synthflow", name: "Synthflow AI (Voz)", description: "Ligações telefônicas automatizadas com agentes de IA para qualificação e agendamento de reuniões.", icon: Phone, category: "SDR Automático", status: "disconnected", lastSync: null, details: "IA conversacional por voz", configFields: [{ label: "API Key", key: "apiKey", placeholder: "sf_...", value: "" }, { label: "Model ID (Agente)", key: "modelId", placeholder: "agent_xxx", value: "" }] },
    { id: "sdr_google_calendar", name: "Google Calendar (Agenda)", description: "Verificação de disponibilidade e agendamento automático de reuniões com leads qualificados.", icon: Calendar, category: "SDR Automático", status: "disconnected", lastSync: null, details: "OAuth2 para acesso ao calendário", configFields: [{ label: "Client ID", key: "clientId", placeholder: "xxx.apps.googleusercontent.com", value: "" }, { label: "Client Secret", key: "clientSecret", placeholder: "GOCSPX-...", value: "" }, { label: "Redirect URI", key: "redirectUri", placeholder: "https://seuapp.com/callback", value: "" }] },
    // ═══ Outras ═══
    { id: uid(), name: "SMTP (E-mail)", description: "Envio de e-mails: propostas, notificações e convites.", icon: Mail, category: "Comunicação", status: "connected", lastSync: "04 Mar 2026", details: "Provider: Amazon SES · 342 e-mails/mês", configFields: [{ label: "Host", key: "host", placeholder: "smtp.provider.com", value: "email-smtp.us-east-1.amazonaws.com" }, { label: "Porta", key: "port", placeholder: "587", value: "587" }] },
    { id: uid(), name: "Stripe", description: "Geração de links de pagamento e cobrança recorrente.", icon: CreditCard, category: "Pagamentos", status: "disconnected", lastSync: null, details: "Conecte para gerar links de pagamento", apiKey: "", configFields: [{ label: "Secret Key", key: "sk", placeholder: "sk_live_...", value: "" }, { label: "Webhook Secret", key: "whsec", placeholder: "whsec_...", value: "" }] },
    { id: uid(), name: "Slack", description: "Notificações de propostas e comentários.", icon: MessageSquare, category: "Comunicação", status: "disconnected", lastSync: null, details: "Conecte para receber notificações", webhookUrl: "", configFields: [{ label: "Webhook URL", key: "webhook", placeholder: "https://hooks.slack.com/...", value: "" }] },
    { id: uid(), name: "Google Drive", description: "Backup automático de PDFs no Drive.", icon: Cloud, category: "Armazenamento", status: "coming_soon", lastSync: null, details: "Em breve: backup automático" },
    { id: uid(), name: "HubSpot CRM", description: "Sincronize contatos e deals com HubSpot.", icon: Database, category: "CRM", status: "coming_soon", lastSync: null, details: "Em breve: sync bidirecional" },
    { id: uid(), name: "Google Analytics", description: "Rastreie visualizações e interações.", icon: BarChart3, category: "Analytics", status: "disconnected", lastSync: null, details: "Rastreamento de comportamento", configFields: [{ label: "Measurement ID", key: "mid", placeholder: "G-XXXXXXXXXX", value: "" }] },
    { id: uid(), name: "Pagar.me", description: "Pagamentos via boleto, Pix e cartão.", icon: CreditCard, category: "Pagamentos", status: "disconnected", lastSync: null, details: "Gateway brasileiro preferido", apiKey: "", configFields: [{ label: "API Key", key: "ak", placeholder: "ak_live_...", value: "" }, { label: "Secret Key", key: "sk", placeholder: "sk_live_...", value: "" }] },
    { id: uid(), name: "Zapier", description: "Conecte com 5000+ apps via automações.", icon: Zap, category: "IA & Automação", status: "disconnected", lastSync: null, details: "Automações ilimitadas", webhookUrl: "", configFields: [{ label: "API Key", key: "zk", placeholder: "zap_...", value: "" }] },
    { id: uid(), name: "Make (Integromat)", description: "Automações avançadas com cenários visuais.", icon: Zap, category: "IA & Automação", status: "coming_soon", lastSync: null, details: "Em breve" },
    { id: uid(), name: "RD Station", description: "Automação de marketing e nutrição de leads.", icon: Globe, category: "Marketing", status: "disconnected", lastSync: null, details: "Marketing digital", configFields: [{ label: "API Token", key: "rd", placeholder: "token...", value: "" }] },
    { id: uid(), name: "Pipedrive", description: "CRM de vendas com pipeline visual.", icon: Database, category: "CRM", status: "disconnected", lastSync: null, details: "Gestão de pipeline", configFields: [{ label: "API Token", key: "pd", placeholder: "token...", value: "" }] },
    { id: uid(), name: "Notion", description: "Documentação e base de conhecimento.", icon: FileText, category: "Produtividade", status: "disconnected", lastSync: null, details: "Docs e wikis", configFields: [{ label: "Integration Token", key: "nt", placeholder: "secret_...", value: "" }] },
    { id: uid(), name: "Jira", description: "Gestão de tarefas e sprints.", icon: GitBranch, category: "Desenvolvimento", status: "coming_soon", lastSync: null, details: "Em breve" },
    { id: uid(), name: "GitHub", description: "Repositórios e deploy automático.", icon: GitBranch, category: "Desenvolvimento", status: "disconnected", lastSync: null, details: "CI/CD integrado", configFields: [{ label: "Token", key: "gh", placeholder: "ghp_...", value: "" }] },
    { id: uid(), name: "AWS S3", description: "Armazenamento de arquivos e assets.", icon: Cloud, category: "Armazenamento", status: "connected", lastSync: "03 Mar 2026", details: "Bucket: propostas-prod", configFields: [{ label: "Access Key", key: "s3ak", placeholder: "AKIA...", value: "AKIA***EXAMPLE" }, { label: "Bucket", key: "s3b", placeholder: "my-bucket", value: "propostas-prod" }] },
    { id: uid(), name: "Synthflow AI", description: "Agentes de IA para ligações telefônicas.", icon: Phone, category: "Comunicação", status: "coming_soon", lastSync: null, details: "Veja SDR Automático" },
    { id: uid(), name: "Mixpanel", description: "Analytics de produto e métricas de uso.", icon: BarChart3, category: "Analytics", status: "coming_soon", lastSync: null, details: "Em breve" },
    { id: uid(), name: "Asaas", description: "Cobranças, boletos e gestão financeira.", icon: Receipt, category: "Financeiro", status: "disconnected", lastSync: null, details: "Plataforma financeira", configFields: [{ label: "API Key", key: "as", placeholder: "$aas_...", value: "" }] },
    { id: uid(), name: "Trello", description: "Quadro Kanban para gerenciamento de projetos.", icon: Boxes, category: "Produtividade", status: "disconnected", lastSync: null, details: "Boards e cards", configFields: [{ label: "API Key", key: "tr", placeholder: "key...", value: "" }] },
    { id: uid(), name: "Sentry", description: "Monitoramento de erros e performance.", icon: Shield, category: "Desenvolvimento", status: "disconnected", lastSync: null, details: "Error tracking", configFields: [{ label: "DSN", key: "dsn", placeholder: "https://...@sentry.io/...", value: "" }] },
    { id: uid(), name: "Webhook Personalizado", description: "Envie eventos para qualquer endpoint.", icon: Webhook, category: "Desenvolvimento", status: "disconnected", lastSync: null, details: "POST para URL customizada", webhookUrl: "", configFields: [{ label: "URL", key: "url", placeholder: "https://api.example.com/webhook", value: "" }, { label: "Secret", key: "sec", placeholder: "secret_key", value: "" }] },
];

/* ═══ Status Config ═══ */

export const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    connected: { label: "Conectado", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", dot: "bg-blue-500" },
    disconnected: { label: "Disponível", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", dot: "bg-slate-500" },
    coming_soon: { label: "Em Breve", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500" },
};

/* ═══ Category Icons ═══ */

export const categoryIcons: Record<string, any> = {
    "Propostas": FileText,
    "IA & Automação": Zap,
    "Comunicação": MessageSquare,
    "Pagamentos": CreditCard,
    "Produtividade": Calendar,
    "Armazenamento": Cloud,
    "CRM": Database,
    "Analytics": BarChart3,
    "Desenvolvimento": GitBranch,
    "E-commerce": Boxes,
    "Logística": Truck,
    "Marketing": Globe,
    "Segurança": Shield,
    "Notificações": BellRing,
    "RH": Users,
    "Financeiro": Receipt,
    "SDR Automático": Zap,
};

/* ═══ Provider Maps ═══ */

export const providerMap: Record<string, string> = {
    sdr_anthropic: "anthropic",
    sdr_brevo: "brevo",
    sdr_whatsapp: "whatsapp",
    sdr_synthflow: "synthflow",
    sdr_google_calendar: "google_calendar",
    proposal_openai: "proposal_openai",
    proposal_brevo: "proposal_brevo",
    proposal_whisper: "proposal_whisper",
    proposal_minimax: "proposal_minimax",
};

export const credentialKeyMap: Record<string, string[]> = {
    anthropic: ["apiKey", "model", "maxTokens"],
    brevo: ["apiKey", "fromEmail", "fromName"],
    whatsapp: ["accessToken", "phoneNumberId", "businessAccountId", "verifyToken"],
    synthflow: ["apiKey", "modelId"],
    google_calendar: ["clientId", "clientSecret", "redirectUri"],
    proposal_openai: ["apiKey", "model", "maxTokens", "temperature"],
    proposal_brevo: ["apiKey", "fromEmail", "fromName"],
    proposal_whisper: ["apiKey", "model"],
    proposal_minimax: ["apiKey", "groupId", "model", "maxTokens"],
};

/* ═══ Helper: find integration by ID ═══ */

export function findIntegration(id: string): Integration | undefined {
    return initialIntegrations.find(i => i.id === id);
}

export function isMappedIntegration(id: string): boolean {
    return id in providerMap;
}
