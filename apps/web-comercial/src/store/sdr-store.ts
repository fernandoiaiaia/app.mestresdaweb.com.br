"use client";

import { create } from "zustand";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

export interface Playbook {
    id: string;
    name: string;
    valueProposition: string;
    description: string;
    pains: string[];
    differentials: string[];
    objections: { objection: string; response: string }[];
    cases: { client: string; result: string; quote: string }[];
    priceRange: string;
    aiInstructions: string;
    status: "active" | "inactive";
    cadenceCount: number;
    conversionRate: number;
    createdAt: string;
}

export interface Persona {
    id: string;
    name: string;
    targetRoles: string[];
    seniority: string;
    segments: string[];
    companySize: string;
    pains: string[];
    buyMotivations: string[];
    language: string;
    objections: string[];
    aiInstructions: string;
    status: "active" | "inactive";
    cadenceCount: number;
    createdAt: string;
}

export interface Identity {
    id: string;
    name: string;
    email: string;
    emailStatus: "connected" | "disconnected" | "warming";
    warmupLevel: number; // 0-100
    whatsappNumber: string;
    whatsappConnected: boolean;
    phoneNumber: string;
    phoneConnected: boolean;
    signature: string;
    dailyLimits: { email: number; whatsapp: number; phone: number };
    createdAt: string;
}

export type CadenceStatus = "draft" | "active" | "paused" | "archived";
export type AutomationLevel = "autopilot" | "semi" | "assisted";

export interface CadenceNode {
    id: string;
    type: "start" | "email" | "whatsapp" | "phone" | "delay" | "condition_email_opened" | "condition_email_replied" | "condition_whatsapp_replied" | "condition_call_answered" | "condition_score" | "end_success" | "end_no_contact" | "end_optout" | "escalate" | "schedule_meeting";
    position: { x: number; y: number };
    data: {
        label: string;
        content?: any;
        hasContent?: boolean;
    };
}

export interface CadenceEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    label?: string;
}

export interface Cadence {
    id: string;
    name: string;
    playbookId: string;
    personaId: string;
    identityId: string;
    automationLevel: AutomationLevel;
    status: CadenceStatus;
    schedule: { days: string[]; startTime: string; endTime: string };
    timezone: string;
    nodes: CadenceNode[];
    edges: CadenceEdge[];
    leadsActive: number;
    conversionRate: number;
    createdAt: string;
}

export type LeadStatus = "new" | "contacted" | "replied" | "qualified" | "meeting_scheduled" | "unresponsive" | "opt_out";
export type LeadTemperature = "hot" | "warm" | "cold";

export interface SDRLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    segment: string;
    role: string;
    cadenceId: string | null;
    status: LeadStatus;
    score: number;
    temperature: LeadTemperature;
    currentStep: number;
    nextAction: string;
    nextActionAt: string;
    needsIntervention: boolean;
    interventionReason?: string;
    qualificationData: { budget?: boolean; authority?: boolean; need?: string; timeline?: string };
    tags: string[];
    createdAt: string;
    lastInteraction: string;
}

export type ConversationChannel = "email" | "whatsapp" | "phone";

export interface ConversationMessage {
    id: string;
    channel: ConversationChannel;
    direction: "inbound" | "outbound";
    content: string;
    subject?: string;
    timestamp: string;
    metadata?: {
        opened?: boolean;
        clicked?: boolean;
        duration?: number;
        transcription?: string;
        callResult?: "answered" | "missed" | "voicemail";
        aiReasoning?: string;
    };
}

export interface Conversation {
    id: string;
    leadId: string;
    messages: ConversationMessage[];
    status: "open" | "resolved" | "intervention";
    unreadCount: number;
    lastMessageAt: string;
}

export interface QualificationCriteria {
    id: string;
    name: string;
    description: string;
    type: "boolean" | "text" | "number";
    weight: number;
    aiPrompt: string;
    sortOrder: number;
}

export interface QualificationThreshold {
    hotMin: number;
    warmMin: number;
    hotAction: string;
    warmAction: string;
    coldAction: string;
}

export interface OptOut {
    id: string;
    leadName: string;
    email: string;
    phone: string;
    channel: ConversationChannel;
    reason: string;
    date: string;
}

// ═══════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════

const mockPlaybooks: Playbook[] = [
    {
        id: "pb_1", name: "Plataforma SaaS de Gestão", valueProposition: "Reduza 40% do tempo operacional com automação inteligente",
        description: "Plataforma de gestão empresarial com IA integrada que automatiza processos de vendas, financeiro e RH. Ideal para empresas de 20 a 500 funcionários que buscam escalar sem aumentar equipe.",
        pains: ["Processos manuais lentos", "Falta de visibilidade dos dados", "Dificuldade de escalar operações", "Equipe sobrecarregada"],
        differentials: ["IA nativa para automação", "Implementação em 15 dias", "Suporte 24/7 em português", "ROI comprovado em 3 meses"],
        objections: [
            { objection: "É caro demais", response: "Nosso ROI médio é 3x em 6 meses. Posso mostrar um case do seu segmento?" },
            { objection: "Já temos um sistema", response: "Integramos com os principais ERPs. A migração é gratuita e assistida." },
            { objection: "Não tenho tempo para implementar", response: "Nossa equipe faz 90% do trabalho. Você precisa de apenas 2h por semana." }
        ],
        cases: [
            { client: "TechCorp", result: "Reduziu 60% do tempo de emissão de propostas", quote: "Em 3 meses já pagou o investimento." },
            { client: "Varejo Express", result: "Aumentou vendas em 35% com automação de follow-up", quote: "Nunca mais perdemos um lead por esquecimento." }
        ],
        priceRange: "R$ 497 a R$ 2.997/mês", aiInstructions: "Sempre mencione o período de teste gratuito de 14 dias. Nunca critique concorrentes diretamente.",
        status: "active", cadenceCount: 3, conversionRate: 18.5, createdAt: "2026-01-15T10:00:00Z"
    },
    {
        id: "pb_2", name: "Consultoria de Processos", valueProposition: "Diagnosticamos e otimizamos seus processos em 30 dias",
        description: "Serviço de consultoria especializada em mapeamento e otimização de processos empresariais, usando metodologias Lean e Six Sigma adaptadas para PMEs brasileiras.",
        pains: ["Processos desorganizados", "Retrabalho constante", "Falta de padronização", "Custos operacionais altos"],
        differentials: ["Metodologia própria testada em 200+ empresas", "Entrega de quick wins na primeira semana", "Equipe senior (10+ anos de experiência)"],
        objections: [
            { objection: "Consultoria não funciona no nosso caso", response: "Temos cases específicos do seu setor. Posso compartilhar?" },
            { objection: "O timing não é bom", response: "Quanto mais tempo sem otimizar, mais dinheiro perdido. Podemos começar com um diagnóstico gratuito." }
        ],
        cases: [
            { client: "Indústria Apex", result: "Reduziu custos operacionais em 25%", quote: "A consultoria se pagou no primeiro mês." }
        ],
        priceRange: "R$ 15.000 a R$ 80.000 (projeto)", aiInstructions: "Foco em ROI e resultados mensuráveis. Ofereça diagnóstico gratuito como porta de entrada.",
        status: "active", cadenceCount: 1, conversionRate: 22.0, createdAt: "2026-02-01T10:00:00Z"
    },
    {
        id: "pb_3", name: "App Mobile Customizado", valueProposition: "Seu app no ar em 60 dias com tecnologia de ponta",
        description: "Desenvolvimento de aplicativos mobile nativos e híbridos para iOS e Android. Do design ao deploy na store, com manutenção mensal inclusa no primeiro ano.",
        pains: ["Presença digital fraca", "Processos que precisam de mobilidade", "Concorrentes já têm app", "Atendimento ao cliente limitado"],
        differentials: ["Design premiado", "Entrega em 60 dias", "Code review por senior devs", "Manutenção inclusa 12 meses"],
        objections: [{ objection: "Muito caro", response: "Parcelamos em até 12x. E o app gera receita desde o primeiro mês." }],
        cases: [],
        priceRange: "R$ 50.000 a R$ 250.000", aiInstructions: "Sempre pergunte sobre o público-alvo do app antes de falar de preço.",
        status: "inactive", cadenceCount: 0, conversionRate: 0, createdAt: "2026-02-20T10:00:00Z"
    }
];

const mockPersonas: Persona[] = [
    {
        id: "per_1", name: "CEO / Fundador de Startup", targetRoles: ["CEO", "Fundador", "Co-founder", "Sócio"],
        seniority: "C-Level", segments: ["Tecnologia", "SaaS", "Startup"], companySize: "startup",
        pains: ["Escalar sem aumentar custo", "Falta de processos", "Decisões sem dados", "Equipe enxuta sobrecarregada"],
        buyMotivations: ["ROI rápido", "Eficiência operacional", "Vantagem competitiva"],
        language: "casual", objections: ["Não tenho tempo", "Preciso de resultado imediato", "Budget apertado"],
        aiInstructions: "Seja direto e objetivo. CEOs não têm paciência para enrolação. Use dados e números. Mencione cases de startups.",
        status: "active", cadenceCount: 2, createdAt: "2026-01-15T10:00:00Z"
    },
    {
        id: "per_2", name: "Gerente de TI Corporação", targetRoles: ["Gerente de TI", "CTO", "Diretor de Tecnologia", "Head de TI"],
        seniority: "Gerência", segments: ["Enterprise", "Indústria", "Financeiro"], companySize: "enterprise",
        pains: ["Sistemas legados", "Integração entre ferramentas", "Segurança de dados", "Pressão por inovação"],
        buyMotivations: ["Compliance", "Redução de risco", "Modernização", "Eficiência da equipe"],
        language: "formal", objections: ["Precisa passar por procurement", "Temos contrato com outro fornecedor", "Precisamos de caso de uso específico"],
        aiInstructions: "Use linguagem técnica. Mencione integrações, APIs, segurança. Respeite o processo de compra corporativo.",
        status: "active", cadenceCount: 1, createdAt: "2026-01-20T10:00:00Z"
    },
    {
        id: "per_3", name: "Diretor Comercial PME", targetRoles: ["Diretor Comercial", "VP de Vendas", "Head Comercial"],
        seniority: "Direção", segments: ["Varejo", "Serviços", "Distribuição"], companySize: "pme",
        pains: ["Pipeline desorganizado", "Vendedores sem processo", "Perda de leads", "Falta de previsibilidade"],
        buyMotivations: ["Aumento de receita", "Controle do pipeline", "Produtividade da equipe"],
        language: "direta", objections: ["Meus vendedores não vão usar", "Já tentamos CRM antes"],
        aiInstructions: "Fale a língua de vendas. Use métricas de conversão, ticket médio, ciclo de venda. Ofereça demo personalizada.",
        status: "active", cadenceCount: 1, createdAt: "2026-02-01T10:00:00Z"
    }
];

const mockIdentities: Identity[] = [
    {
        id: "id_1", name: "João Silva", email: "joao@mestresdaweb.com.br", emailStatus: "connected", warmupLevel: 85,
        whatsappNumber: "+5511999990001", whatsappConnected: true, phoneNumber: "+5511999990001", phoneConnected: true,
        signature: "João Silva\nAdvisor Sênior | Mestres da Web\n📱 (11) 99999-0001\n🌐 mestresdaweb.com.br",
        dailyLimits: { email: 80, whatsapp: 50, phone: 20 }, createdAt: "2026-01-01T10:00:00Z"
    },
    {
        id: "id_2", name: "Maria Santos", email: "maria@mestresdaweb.com.br", emailStatus: "warming", warmupLevel: 45,
        whatsappNumber: "+5511999990002", whatsappConnected: true, phoneNumber: "", phoneConnected: false,
        signature: "Maria Santos\nAdvisor | Mestres da Web\n📱 (11) 99999-0002",
        dailyLimits: { email: 30, whatsapp: 50, phone: 0 }, createdAt: "2026-02-10T10:00:00Z"
    }
];

const mockCadences: Cadence[] = [
    {
        id: "cad_1", name: "Prospecção SaaS — CEO Startup", playbookId: "pb_1", personaId: "per_1", identityId: "id_1",
        automationLevel: "autopilot", status: "active",
        schedule: { days: ["seg", "ter", "qua", "qui", "sex"], startTime: "08:00", endTime: "18:00" },
        timezone: "America/Sao_Paulo",
        nodes: [
            { id: "n1", type: "start", position: { x: 250, y: 0 }, data: { label: "Início" } },
            { id: "n2", type: "email", position: { x: 250, y: 120 }, data: { label: "E-mail de Apresentação", hasContent: true, content: { subject: "Como {empresa} pode reduzir 40% do tempo operacional", body: "Olá {nome},\n\nVi que a {empresa} atua em {segmento}..." } } },
            { id: "n3", type: "delay", position: { x: 250, y: 240 }, data: { label: "Aguardar 2 dias", content: { days: 2, hours: 0, businessHours: true } } },
            { id: "n4", type: "condition_email_opened", position: { x: 250, y: 360 }, data: { label: "E-mail aberto?" } },
            { id: "n5", type: "whatsapp", position: { x: 100, y: 500 }, data: { label: "WhatsApp Follow-up", hasContent: true } },
            { id: "n6", type: "phone", position: { x: 400, y: 500 }, data: { label: "Ligação Direta", hasContent: true } },
            { id: "n7", type: "end_success", position: { x: 250, y: 650 }, data: { label: "Fim — Sucesso" } },
        ],
        edges: [
            { id: "e1", source: "n1", target: "n2" },
            { id: "e2", source: "n2", target: "n3" },
            { id: "e3", source: "n3", target: "n4" },
            { id: "e4", source: "n4", target: "n5", sourceHandle: "yes", label: "Sim" },
            { id: "e5", source: "n4", target: "n6", sourceHandle: "no", label: "Não" },
            { id: "e6", source: "n5", target: "n7" },
            { id: "e7", source: "n6", target: "n7" },
        ],
        leadsActive: 18, conversionRate: 15.2, createdAt: "2026-02-01T10:00:00Z"
    },
    {
        id: "cad_2", name: "Consultoria — Gerente TI", playbookId: "pb_2", personaId: "per_2", identityId: "id_1",
        automationLevel: "semi", status: "active",
        schedule: { days: ["seg", "ter", "qua", "qui", "sex"], startTime: "09:00", endTime: "17:00" },
        timezone: "America/Sao_Paulo",
        nodes: [
            { id: "n1", type: "start", position: { x: 250, y: 0 }, data: { label: "Início" } },
            { id: "n2", type: "email", position: { x: 250, y: 120 }, data: { label: "E-mail Formal", hasContent: true } },
            { id: "n3", type: "delay", position: { x: 250, y: 240 }, data: { label: "Aguardar 3 dias" } },
            { id: "n4", type: "email", position: { x: 250, y: 360 }, data: { label: "Follow-up E-mail", hasContent: true } },
            { id: "n5", type: "end_success", position: { x: 250, y: 480 }, data: { label: "Fim" } },
        ],
        edges: [
            { id: "e1", source: "n1", target: "n2" },
            { id: "e2", source: "n2", target: "n3" },
            { id: "e3", source: "n3", target: "n4" },
            { id: "e4", source: "n4", target: "n5" },
        ],
        leadsActive: 8, conversionRate: 20.0, createdAt: "2026-02-15T10:00:00Z"
    },
    {
        id: "cad_3", name: "Pipeline Comercial — Diretor", playbookId: "pb_1", personaId: "per_3", identityId: "id_2",
        automationLevel: "assisted", status: "draft",
        schedule: { days: ["seg", "ter", "qua", "qui", "sex"], startTime: "08:00", endTime: "18:00" },
        timezone: "America/Sao_Paulo",
        nodes: [
            { id: "n1", type: "start", position: { x: 250, y: 0 }, data: { label: "Início" } },
            { id: "n2", type: "email", position: { x: 250, y: 120 }, data: { label: "E-mail Inicial", hasContent: false } },
        ],
        edges: [{ id: "e1", source: "n1", target: "n2" }],
        leadsActive: 0, conversionRate: 0, createdAt: "2026-03-01T10:00:00Z"
    }
];

const mockLeads: SDRLead[] = [
    { id: "l1", name: "Carlos Silva", email: "carlos@techsolutions.com.br", phone: "+5511999001001", company: "Tech Solutions", segment: "Tecnologia", role: "CEO", cadenceId: "cad_1", status: "replied", score: 78, temperature: "warm", currentStep: 3, nextAction: "WhatsApp follow-up", nextActionAt: "2026-03-07T10:00:00Z", needsIntervention: true, interventionReason: "Lead pediu desconto — IA não pode aprovar", qualificationData: { budget: true, authority: true, need: "Automação de processos", timeline: "30 dias" }, tags: ["B2B", "SaaS"], createdAt: "2026-02-20T10:00:00Z", lastInteraction: "2026-03-06T15:30:00Z" },
    { id: "l2", name: "Mariana Costa", email: "mariana@agenciacriativa.com.br", phone: "+5511999001002", company: "Agência Criativa", segment: "Marketing", role: "Diretora", cadenceId: "cad_1", status: "contacted", score: 35, temperature: "cold", currentStep: 2, nextAction: "Aguardando resposta e-mail", nextActionAt: "2026-03-08T09:00:00Z", needsIntervention: false, qualificationData: {}, tags: ["Marketing"], createdAt: "2026-02-22T10:00:00Z", lastInteraction: "2026-03-05T11:00:00Z" },
    { id: "l3", name: "Ricardo Almeida", email: "ricardo@logisticasa.com.br", phone: "+5511999001003", company: "Logística SA", segment: "Logística", role: "Gerente de TI", cadenceId: "cad_2", status: "qualified", score: 92, temperature: "hot", currentStep: 4, nextAction: "Agendar reunião", nextActionAt: "2026-03-07T14:00:00Z", needsIntervention: false, qualificationData: { budget: true, authority: true, need: "Modernização de sistemas", timeline: "15 dias" }, tags: ["Enterprise"], createdAt: "2026-02-18T10:00:00Z", lastInteraction: "2026-03-06T16:45:00Z" },
    { id: "l4", name: "Fernanda Lima", email: "fernanda@clinicabestar.com.br", phone: "+5521988001004", company: "Clínica Bem Estar", segment: "Saúde", role: "CEO", cadenceId: "cad_1", status: "meeting_scheduled", score: 95, temperature: "hot", currentStep: 5, nextAction: "Reunião 10/03 às 14h", nextActionAt: "2026-03-10T14:00:00Z", needsIntervention: false, qualificationData: { budget: true, authority: true, need: "Gestão de pacientes", timeline: "Imediato" }, tags: ["Saúde"], createdAt: "2026-02-15T10:00:00Z", lastInteraction: "2026-03-06T10:00:00Z" },
    { id: "l5", name: "Sérgio Ramos", email: "sergio@horizonteconstrutora.com.br", phone: "+5531977001005", company: "Construtora Horizonte", segment: "Construção", role: "Diretor Comercial", cadenceId: "cad_1", status: "contacted", score: 22, temperature: "cold", currentStep: 1, nextAction: "E-mail de follow-up", nextActionAt: "2026-03-09T08:00:00Z", needsIntervention: false, qualificationData: {}, tags: ["Construção"], createdAt: "2026-03-01T10:00:00Z", lastInteraction: "2026-03-04T09:00:00Z" },
    { id: "l6", name: "Beatriz Souza", email: "beatriz@educatech.io", phone: "+5541966001006", company: "EducaTech", segment: "Educação", role: "Fundadora", cadenceId: null, status: "new", score: 0, temperature: "cold", currentStep: 0, nextAction: "—", nextActionAt: "", needsIntervention: false, qualificationData: {}, tags: ["EdTech"], createdAt: "2026-03-05T10:00:00Z", lastInteraction: "" },
    { id: "l7", name: "Thiago Mendes", email: "thiago@mendesadv.com.br", phone: "+5551955001007", company: "Mendes Advocacia", segment: "Jurídico", role: "Sócio", cadenceId: null, status: "new", score: 0, temperature: "cold", currentStep: 0, nextAction: "—", nextActionAt: "", needsIntervention: false, qualificationData: {}, tags: ["Jurídico"], createdAt: "2026-03-05T10:00:00Z", lastInteraction: "" },
    { id: "l8", name: "Ana Oliveira", email: "ana@oliveiraconsultoria.com.br", phone: "+5511999001008", company: "Oliveira Consultoria", segment: "Consultoria", role: "CEO", cadenceId: null, status: "new", score: 0, temperature: "cold", currentStep: 0, nextAction: "—", nextActionAt: "", needsIntervention: false, qualificationData: {}, tags: ["Consultoria"], createdAt: "2026-03-06T10:00:00Z", lastInteraction: "" },
    { id: "l9", name: "Pedro Santos", email: "pedro@santosfinanceiro.com.br", phone: "+5521988001009", company: "Santos Financeiro", segment: "Finanças", role: "CFO", cadenceId: "cad_1", status: "unresponsive", score: 10, temperature: "cold", currentStep: 5, nextAction: "Cadência encerrada", nextActionAt: "", needsIntervention: false, qualificationData: {}, tags: ["Fintech"], createdAt: "2026-02-10T10:00:00Z", lastInteraction: "2026-02-28T09:00:00Z" },
    { id: "l10", name: "Juliana Ferreira", email: "juliana@modaexpress.com.br", phone: "+5511999001010", company: "Moda Express", segment: "Moda", role: "Diretora", cadenceId: "cad_2", status: "replied", score: 55, temperature: "warm", currentStep: 2, nextAction: "Aguardando humano assumir", nextActionAt: "2026-03-07T09:00:00Z", needsIntervention: true, interventionReason: "Lead respondeu com dúvida técnica sobre integração", qualificationData: { budget: true, authority: false, need: "E-commerce integrado" }, tags: ["E-commerce"], createdAt: "2026-02-25T10:00:00Z", lastInteraction: "2026-03-06T18:00:00Z" },
];

const mockConversations: Conversation[] = [
    {
        id: "conv_1", leadId: "l1", status: "intervention", unreadCount: 2, lastMessageAt: "2026-03-06T15:30:00Z",
        messages: [
            { id: "m1", channel: "email", direction: "outbound", content: "Olá Carlos,\n\nVi que a Tech Solutions atua no segmento de tecnologia e temos ajudado empresas similares a reduzir 40% do tempo operacional com nossa plataforma de gestão com IA.\n\nPosso mostrar como funciona em uma demo rápida de 15 minutos?\n\nAbraço,\nJoão Silva", subject: "Como a Tech Solutions pode reduzir 40% do tempo operacional", timestamp: "2026-03-04T09:00:00Z", metadata: { opened: true, clicked: true, aiReasoning: "Primeiro contato via e-mail conforme cadência. Template personalizado com dados do playbook SaaS + persona CEO." } },
            { id: "m2", channel: "email", direction: "inbound", content: "João, achei interessante. Quanto custa?", timestamp: "2026-03-05T14:00:00Z" },
            { id: "m3", channel: "whatsapp", direction: "outbound", content: "Oi Carlos! Vi que você se interessou pela nossa plataforma. Os planos vão de R$ 497 a R$ 2.997/mês dependendo do tamanho da operação. Posso te apresentar em uma call rápida?", timestamp: "2026-03-05T14:30:00Z", metadata: { aiReasoning: "Lead respondeu com interesse. Segui com preço conforme orientação do playbook e proposta de call." } },
            { id: "m4", channel: "whatsapp", direction: "inbound", content: "Achei caro. Tem desconto para pagamento anual?", timestamp: "2026-03-06T15:30:00Z" },
        ]
    },
    {
        id: "conv_2", leadId: "l3", status: "open", unreadCount: 0, lastMessageAt: "2026-03-06T16:45:00Z",
        messages: [
            { id: "m5", channel: "email", direction: "outbound", content: "Prezado Ricardo,\n\nA Logística SA enfrenta desafios com sistemas legados? Nossa consultoria especializada já ajudou mais de 200 empresas a modernizar sua infraestrutura.\n\nGostaria de agendar uma reunião para apresentar nosso diagnóstico gratuito?", subject: "Modernização de sistemas para Logística SA", timestamp: "2026-03-02T09:00:00Z", metadata: { opened: true, clicked: false, aiReasoning: "Contato formal conforme persona Gerente TI. Tom técnico." } },
            { id: "m6", channel: "email", direction: "inbound", content: "Olá, temos interesse sim. Podemos conversar na quinta?", timestamp: "2026-03-04T10:00:00Z" },
            { id: "m7", channel: "phone", direction: "outbound", content: "[Transcrição] João: Olá Ricardo, tudo bem? Ricardo: Tudo ótimo. Então, sobre aquele diagnóstico... João: Sim! Posso agendar para quinta às 14h? Ricardo: Perfeito, pode confirmar por e-mail? João: Claro! Obrigado, Ricardo.", timestamp: "2026-03-06T16:45:00Z", metadata: { duration: 145, callResult: "answered", transcription: "Conversa produtiva. Lead confirmou interesse em diagnóstico gratuito.", aiReasoning: "Ligação de confirmação. Lead qualificado — agendamento realizado." } },
        ]
    },
    {
        id: "conv_3", leadId: "l10", status: "intervention", unreadCount: 1, lastMessageAt: "2026-03-06T18:00:00Z",
        messages: [
            { id: "m8", channel: "email", direction: "outbound", content: "Olá Juliana,\n\nA Moda Express está buscando otimizar processos? Nossa consultoria tem cases específicos do varejo de moda.", subject: "Otimização de processos — Moda Express", timestamp: "2026-03-03T09:00:00Z", metadata: { opened: true, aiReasoning: "Contato inicial via e-mail. Personalizado para segmento moda." } },
            { id: "m9", channel: "email", direction: "inbound", content: "Oi! Temos interesse, mas preciso saber: vocês integram com Shopify e com nosso ERP Totvs? Isso é decisivo para nós.", timestamp: "2026-03-06T18:00:00Z" },
        ]
    }
];

const mockCriteria: QualificationCriteria[] = [
    { id: "crit_1", name: "Budget", description: "O lead possui orçamento disponível para a solução?", type: "boolean", weight: 30, aiPrompt: "Identifique se o lead mencionou orçamento, verba disponível, ou preocupação com custo. Se mencionou que 'é caro' mas continuou a conversa, marque como parcialmente confirmado.", sortOrder: 0 },
    { id: "crit_2", name: "Authority", description: "É o tomador de decisão ou influenciador direto?", type: "boolean", weight: 20, aiPrompt: "Verifique se o lead é quem decide a compra ou se precisa aprovar com outra pessoa. Respostas como 'preciso falar com meu sócio' = Authority negativa.", sortOrder: 1 },
    { id: "crit_3", name: "Need", description: "Qual a dor principal que o lead busca resolver?", type: "text", weight: 30, aiPrompt: "Extraia a principal dor ou necessidade mencionada pelo lead. Se não mencionou explicitamente, infira pela conversa. Marque como 'não informado' se não houver indícios.", sortOrder: 2 },
    { id: "crit_4", name: "Timeline", description: "Pretende resolver em quanto tempo?", type: "text", weight: 20, aiPrompt: "Identifique se o lead mencionou urgência, prazo, ou timeline. 'Preciso para ontem' = imediato. 'Estamos avaliando para o próximo semestre' = longo prazo.", sortOrder: 3 },
];

const mockThresholds: QualificationThreshold = {
    hotMin: 80, warmMin: 50,
    hotAction: "Agendar reunião automaticamente",
    warmAction: "Continuar cadência e nutrir",
    coldAction: "Pausar cadência"
};

const mockOptOuts: OptOut[] = [
    { id: "opt_1", leadName: "Fernando Tavares", email: "fernando@empresa.com.br", phone: "+5511999000111", channel: "email", reason: "Respondeu 'não tenho interesse'", date: "2026-03-01T10:00:00Z" },
    { id: "opt_2", leadName: "Luciana Pires", email: "luciana@corp.com", phone: "+5521988000222", channel: "whatsapp", reason: "Enviou 'PARAR'", date: "2026-03-03T14:00:00Z" },
];

// ═══════════════════════════════════════
// STORE
// ═══════════════════════════════════════

interface SDRStore {
    playbooks: Playbook[];
    personas: Persona[];
    identities: Identity[];
    cadences: Cadence[];
    leads: SDRLead[];
    conversations: Conversation[];
    criteria: QualificationCriteria[];
    thresholds: QualificationThreshold;
    optOuts: OptOut[];
    loading: boolean;

    // ═══ API Fetch ═══
    fetchCadences: () => Promise<void>;
    fetchLeads: (query?: any) => Promise<void>;
    fetchCriteria: () => Promise<void>;
    fetchThresholds: () => Promise<void>;
    fetchMonitorStats: () => Promise<any>;
    fetchActivityFeed: () => Promise<any[]>;

    // Playbook CRUD
    addPlaybook: (pb: Omit<Playbook, "id" | "createdAt" | "cadenceCount" | "conversionRate">) => void;
    updatePlaybook: (id: string, pb: Partial<Playbook>) => void;
    deletePlaybook: (id: string) => void;

    // Persona CRUD
    addPersona: (p: Omit<Persona, "id" | "createdAt" | "cadenceCount">) => void;
    updatePersona: (id: string, p: Partial<Persona>) => void;
    deletePersona: (id: string) => void;

    // Identity CRUD
    addIdentity: (i: Omit<Identity, "id" | "createdAt">) => void;
    updateIdentity: (id: string, i: Partial<Identity>) => void;
    deleteIdentity: (id: string) => void;

    // Cadence CRUD (API-backed)
    addCadence: (c: Omit<Cadence, "id" | "createdAt" | "leadsActive" | "conversionRate">) => void;
    updateCadence: (id: string, c: Partial<Cadence>) => void;
    deleteCadence: (id: string) => void;

    // Lead actions (API-backed)
    activateLeads: (leadIds: string[], cadenceId: string) => void;
    updateLead: (id: string, l: Partial<SDRLead>) => void;

    // Qualification (API-backed)
    updateCriteria: (criteria: QualificationCriteria[]) => void;
    updateThresholds: (t: QualificationThreshold) => void;

    // Helpers
    getPlaybook: (id: string) => Playbook | undefined;
    getPersona: (id: string) => Persona | undefined;
    getIdentity: (id: string) => Identity | undefined;
    getCadence: (id: string) => Cadence | undefined;
    getLeadConversation: (leadId: string) => Conversation | undefined;
}

export const useSDRStore = create<SDRStore>((set, get) => ({
    playbooks: mockPlaybooks,
    personas: mockPersonas,
    identities: mockIdentities,
    cadences: mockCadences,
    leads: mockLeads,
    conversations: mockConversations,
    criteria: mockCriteria,
    thresholds: mockThresholds,
    optOuts: mockOptOuts,
    loading: false,

    // ═══ API Fetch Methods ═══
    fetchCadences: async () => {
        try {
            set({ loading: true });
            const { cadencesApi } = await import("@/lib/sdr-api");
            const res = await cadencesApi.list();
            if (res.success && res.data) {
                // Map API data to frontend Cadence shape
                set({
                    cadences: res.data.map((c: any) => ({
                        ...c,
                        playbookId: "",
                        personaId: "",
                        identityId: "",
                        automationLevel: c.automationLevel || "semi",
                        schedule: { days: ["seg", "ter", "qua", "qui", "sex"], startTime: c.businessHoursStart || "08:00", endTime: c.businessHoursEnd || "18:00" },
                        timezone: c.timezone || "America/Sao_Paulo",
                        nodes: c.nodes || [],
                        edges: c.edges || [],
                        leadsActive: c._count?.enrollments || c.contactsCount || 0,
                        conversionRate: c.conversions || 0,
                    }))
                });
            }
        } catch (e) { console.warn("Fetch cadences failed, using local data:", e); }
        finally { set({ loading: false }); }
    },

    fetchLeads: async (query?: any) => {
        try {
            set({ loading: true });
            const { leadsApi } = await import("@/lib/sdr-api");
            const res = await leadsApi.listAvailable(query);
            if (res.success && res.data) {
                set({ leads: res.data as any });
            }
        } catch (e) { console.warn("Fetch leads failed, using local data:", e); }
        finally { set({ loading: false }); }
    },

    fetchCriteria: async () => {
        try {
            const { qualificationApi } = await import("@/lib/sdr-api");
            const res = await qualificationApi.listCriteria();
            if (res.success && res.data) {
                set({ criteria: res.data as any });
            }
        } catch (e) { console.warn("Fetch criteria failed:", e); }
    },

    fetchThresholds: async () => {
        try {
            const { qualificationApi } = await import("@/lib/sdr-api");
            const res = await qualificationApi.getThresholds();
            if (res.success && res.data) {
                set({ thresholds: res.data as any });
            }
        } catch (e) { console.warn("Fetch thresholds failed:", e); }
    },

    fetchMonitorStats: async () => {
        try {
            const { monitorApi } = await import("@/lib/sdr-api");
            const res = await monitorApi.stats();
            return res.success ? res.data : null;
        } catch (e) { console.warn("Fetch monitor stats failed:", e); return null; }
    },

    fetchActivityFeed: async () => {
        try {
            const { monitorApi } = await import("@/lib/sdr-api");
            const res = await monitorApi.feed();
            return res.success && res.data ? res.data : [];
        } catch (e) { console.warn("Fetch activity feed failed:", e); return []; }
    },

    // Playbook (local only — no backend model yet)
    addPlaybook: (pb) => set(s => ({ playbooks: [{ ...pb, id: `pb_${Date.now()}`, createdAt: new Date().toISOString(), cadenceCount: 0, conversionRate: 0 }, ...s.playbooks] })),
    updatePlaybook: (id, pb) => set(s => ({ playbooks: s.playbooks.map(p => p.id === id ? { ...p, ...pb } : p) })),
    deletePlaybook: (id) => set(s => ({ playbooks: s.playbooks.filter(p => p.id !== id) })),

    // Persona (local only — no backend model yet)
    addPersona: (p) => set(s => ({ personas: [{ ...p, id: `per_${Date.now()}`, createdAt: new Date().toISOString(), cadenceCount: 0 }, ...s.personas] })),
    updatePersona: (id, p) => set(s => ({ personas: s.personas.map(x => x.id === id ? { ...x, ...p } : x) })),
    deletePersona: (id) => set(s => ({ personas: s.personas.filter(p => p.id !== id) })),

    // Identity (local only — no backend model yet)
    addIdentity: (i) => set(s => ({ identities: [{ ...i, id: `id_${Date.now()}`, createdAt: new Date().toISOString() }, ...s.identities] })),
    updateIdentity: (id, i) => set(s => ({ identities: s.identities.map(x => x.id === id ? { ...x, ...i } : x) })),
    deleteIdentity: (id) => set(s => ({ identities: s.identities.filter(i => i.id !== id) })),

    // Cadence (API-backed + local)
    addCadence: (c) => {
        const newCadence = { ...c, id: `cad_${Date.now()}`, createdAt: new Date().toISOString(), leadsActive: 0, conversionRate: 0 };
        set(s => ({ cadences: [newCadence, ...s.cadences] }));
        // Fire and forget API call
        import("@/lib/sdr-api").then(({ cadencesApi }) => {
            cadencesApi.create({
                name: c.name,
                tone: "formal",
                automationLevel: c.automationLevel,
                timezone: c.timezone,
                businessHoursStart: c.schedule?.startTime || "08:00",
                businessHoursEnd: c.schedule?.endTime || "18:00",
            }).catch(console.warn);
        });
    },
    updateCadence: (id, c) => {
        set(s => ({ cadences: s.cadences.map(x => x.id === id ? { ...x, ...c } : x) }));
        import("@/lib/sdr-api").then(({ cadencesApi }) => {
            cadencesApi.update(id, c).catch(console.warn);
        });
    },
    deleteCadence: (id) => {
        set(s => ({ cadences: s.cadences.filter(c => c.id !== id) }));
        import("@/lib/sdr-api").then(({ cadencesApi }) => {
            cadencesApi.delete(id).catch(console.warn);
        });
    },

    // Leads (API-backed + local)
    activateLeads: (leadIds, cadenceId) => {
        set(s => ({
            leads: s.leads.map(l => leadIds.includes(l.id) ? { ...l, cadenceId, status: "contacted" as LeadStatus, currentStep: 1 } : l)
        }));
        import("@/lib/sdr-api").then(({ leadsApi }) => {
            leadsApi.activate(leadIds, cadenceId).catch(console.warn);
        });
    },
    updateLead: (id, l) => set(s => ({ leads: s.leads.map(x => x.id === id ? { ...x, ...l } : x) })),

    // Qualification (API-backed + local)
    updateCriteria: (criteria) => {
        set({ criteria });
        // Sync to API would happen per-criteria on individual add/update/delete
    },
    updateThresholds: (thresholds) => {
        set({ thresholds });
        import("@/lib/sdr-api").then(({ qualificationApi }) => {
            qualificationApi.updateThresholds(thresholds).catch(console.warn);
        });
    },

    // Helpers
    getPlaybook: (id) => get().playbooks.find(p => p.id === id),
    getPersona: (id) => get().personas.find(p => p.id === id),
    getIdentity: (id) => get().identities.find(i => i.id === id),
    getCadence: (id) => get().cadences.find(c => c.id === id),
    getLeadConversation: (leadId) => get().conversations.find(c => c.leadId === leadId),
}));

