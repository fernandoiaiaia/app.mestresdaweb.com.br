"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    Users,
    Building2,
    Palette,
    CreditCard,
    Bell,
    Shield,

    Database,
    Globe,
    ArrowRight,
    Settings,
    Plug,

    DollarSign,
    ClipboardCheck,
    Filter,
    Phone,
    ThumbsDown,
    Package,
    Megaphone,
    Tags,
    MessageCircle,
} from "lucide-react";

const settingsCards = [
    {
        id: "users",
        title: "Usuários",
        description: "Gerencie consultores, gestores e permissões de acesso ao sistema.",
        icon: Users,
        href: "/dashboard/settings/users",
        badge: "12 ativos",
        badgeColor: "green",
    },
    {
        id: "funnels",
        title: "Funis de Venda",
        description: "Crie e gerencie etapas dos funis de vendas e conversão.",
        icon: Filter,
        href: "/dashboard/settings/funnels",
        badge: null,
        badgeColor: null,
    },
    {
        id: "virtual-phone",
        title: "Telefone Virtual",
        description: "Configurações de telefonia VoIP, ramais e gravação de chamadas.",
        icon: Phone,
        href: "/dashboard/settings/virtual-phone",
        badge: "Em breve",
        badgeColor: "amber",
    },
    {
        id: "loss-reasons",
        title: "Motivos de Perda",
        description: "Cadastre motivos padronizados para análise de propostas perdidas.",
        icon: ThumbsDown,
        href: "/dashboard/settings/loss-reasons",
        badge: null,
        badgeColor: null,
    },
    {
        id: "products",
        title: "Produtos e Serviços",
        description: "Catálogo de produtos e serviços disponíveis para propostas.",
        icon: Package,
        href: "/dashboard/settings/products",
        badge: null,
        badgeColor: null,
    },
    {
        id: "sources",
        title: "Fontes e Campanhas",
        description: "Gerencie origens de leads, UTMs e campanhas de marketing.",
        icon: Megaphone,
        href: "/dashboard/settings/sources",
        badge: null,
        badgeColor: null,
    },
    {
        id: "segments",
        title: "Segmentos",
        description: "Defina segmentos de mercado para classificação de clientes.",
        icon: Tags,
        href: "/dashboard/settings/segments",
        badge: null,
        badgeColor: null,
    },
    {
        id: "objections",
        title: "Objeções",
        description: "Banco de objeções comuns e scripts de contorno para consultores.",
        icon: MessageCircle,
        href: "/dashboard/settings/objections",
        badge: null,
        badgeColor: null,
    },
    {
        id: "professionals",
        title: "Profissionais & Valores-Hora",
        description: "Cargos, senioridades e valores-hora para estimativas automáticas.",
        icon: DollarSign,
        href: "/dashboard/settings/professionals",
        badge: "8 cargos",
        badgeColor: "green",
    },
    {
        id: "institutional",
        title: "Institucional",
        description: "Logo, cores, sobre a empresa, portfólio, depoimentos e diferenciais.",
        icon: Building2,
        href: "/dashboard/settings/institutional",
        badge: null,
        badgeColor: null,
    },
    {
        id: "payment",
        title: "Pagamento & Comercial",
        description: "Parcelamentos, descontos, modelos de contratação e thresholds.",
        icon: CreditCard,
        href: "/dashboard/settings/payment",
        badge: null,
        badgeColor: null,
    },
    {
        id: "checklist",
        title: "Checklist de Completude",
        description: "Perguntas padrão usadas na etapa de completude do escopo pela IA.",
        icon: ClipboardCheck,
        href: "/dashboard/settings/checklist",
        badge: "8 perguntas",
        badgeColor: "blue",
    },
    {
        id: "notifications",

        title: "Notificações",
        description: "Configure alertas por e-mail, push e notificações do sistema.",
        icon: Bell,
        href: "/dashboard/settings/notifications",
        badge: null,
        badgeColor: null,
    },
    {
        id: "security",
        title: "Segurança",
        description: "Autenticação, 2FA, políticas de senha e logs de acesso.",
        icon: Shield,
        href: "/dashboard/settings/security",
        badge: null,
        badgeColor: null,
    },

    {
        id: "integrations",
        title: "Integrações",
        description: "APIs externas, CRM, ERPs e ferramentas de produtividade conectadas.",
        icon: Plug,
        href: "/dashboard/settings/integrations",
        badge: "2 ativas",
        badgeColor: "green",
    },

    {
        id: "backup",
        title: "Backup & Dados",
        description: "Exportação de dados, backups automáticos e política de retenção.",
        icon: Database,
        href: "/dashboard/settings/backup",
        badge: null,
        badgeColor: null,
    },
    {
        id: "domain",
        title: "Domínio & White Label",
        description: "Domínio personalizado e identidade white label para seus clientes.",
        icon: Globe,
        href: "/dashboard/settings/domain",
        badge: null,
        badgeColor: null,
    },
];

const badgeColors: Record<string, string> = {
    green: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function SettingsPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Settings size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Configurações</h1>
                        <p className="text-sm text-slate-400">Gerencie todas as configurações do sistema</p>
                    </div>
                </div>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {settingsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link href={card.href}>
                                <div className="group relative bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-300 cursor-pointer h-full">
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />

                                    <div className="relative z-10">
                                        {/* Top row: icon + badge */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                                                <Icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
                                            </div>
                                            {card.badge && (
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColors[card.badgeColor || "slate"]}`}>
                                                    {card.badge}
                                                </span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-blue-50 transition-colors">
                                            {card.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                                            {card.description}
                                        </p>

                                        {/* Arrow */}
                                        <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-blue-500 transition-colors duration-300">
                                            <span className="text-[11px] font-semibold uppercase tracking-widest">Acessar</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
