"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Settings,
    UserPlus,
    Save,
    Eye,
    EyeOff,
    Home,
    Users,
    FileText,
    CreditCard,
    Calendar,
    Receipt,
    Target,
    BarChart3,
    Shield,
    DollarSign,
    PieChart,
    PiggyBank,
    Building2,
    UserCircle,
    Link2,
    Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

/* ═══════════════════════════════════════ */
/* PERMISSION DEFINITIONS                  */
/* ═══════════════════════════════════════ */
type DataScope = "OWN" | "ALL";

interface PermissionDef {
    module: string;
    action: string;
    label: string;
    description?: string;
    hasDataScope?: boolean;
}

interface ModuleGroup {
    section: string;
    sectionIcon: React.ReactNode;
    sectionColor: string;
    modules: {
        name: string;
        icon: React.ReactNode;
        permissions: PermissionDef[];
    }[];
}

/* ── Corporate (Admin Hub) Permissions ── */
const CORPORATE_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Início",
        sectionIcon: <Home size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Dashboard",
                icon: <Home size={16} />,
                permissions: [
                    { module: "admin.dashboard", action: "view", label: "Visualizar Dashboard", description: "Ver resumo financeiro, KPIs e gráficos", hasDataScope: true },
                    { module: "admin.dashboard", action: "export", label: "Exportar Dados", description: "Exportar relatórios do dashboard" },
                ],
            },
            {
                name: "Clientes — Contatos",
                icon: <UserCircle size={16} />,
                permissions: [
                    { module: "admin.clients.contacts", action: "view", label: "Visualizar", description: "Ver lista de contatos", hasDataScope: true },
                    { module: "admin.clients.contacts", action: "create", label: "Criar", description: "Cadastrar novos contatos" },
                    { module: "admin.clients.contacts", action: "edit", label: "Editar", description: "Alterar dados de contatos" },
                    { module: "admin.clients.contacts", action: "delete", label: "Excluir", description: "Remover contatos" },
                    { module: "admin.clients.contacts", action: "export", label: "Exportar", description: "Exportar lista de contatos" },
                ],
            },
            {
                name: "Clientes — Empresas",
                icon: <Building2 size={16} />,
                permissions: [
                    { module: "admin.clients.companies", action: "view", label: "Visualizar", description: "Ver lista de empresas", hasDataScope: true },
                    { module: "admin.clients.companies", action: "create", label: "Criar", description: "Cadastrar novas empresas" },
                    { module: "admin.clients.companies", action: "edit", label: "Editar", description: "Alterar dados de empresas" },
                    { module: "admin.clients.companies", action: "delete", label: "Excluir", description: "Remover empresas" },
                    { module: "admin.clients.companies", action: "export", label: "Exportar", description: "Exportar lista de empresas" },
                ],
            },
        ],
    },
    {
        section: "Contratos",
        sectionIcon: <FileText size={16} />,
        sectionColor: "text-emerald-400",
        modules: [
            {
                name: "Contratos",
                icon: <FileText size={16} />,
                permissions: [
                    { module: "admin.contracts", action: "view", label: "Visualizar Contratos", description: "Acesso somente leitura, sem edição", hasDataScope: true },
                    { module: "admin.contracts", action: "create", label: "Criar Contrato", description: "Criar novos contratos e rascunhos" },
                    { module: "admin.contracts", action: "edit", label: "Editar Contrato", description: "Editar contratos em rascunho ou revisão" },
                    { module: "admin.contracts", action: "send", label: "Enviar para assinatura", description: "Disparar o contrato para as partes" },
                    { module: "admin.contracts", action: "models", label: "Gerenciar modelos", description: "Criar e editar modelos de contrato e e-mail" },
                    { module: "admin.contracts", action: "analyze", label: "Analisar contratos externos", description: "Acesso ao módulo de análise de terceiros" },
                    { module: "admin.contracts", action: "evidences", label: "Acessar evidências", description: "Visualizar log de evidências e auditoria" },
                    { module: "admin.contracts", action: "admin", label: "Administrador do módulo", description: "Acesso total incluindo configurações de retenção e auditoria" },
                ],
            },
        ],
    },
    {
        section: "Financeiro",
        sectionIcon: <DollarSign size={16} />,
        sectionColor: "text-green-400",
        modules: [
            {
                name: "Transações",
                icon: <DollarSign size={16} />,
                permissions: [
                    { module: "admin.financial.transactions", action: "view", label: "Visualizar", description: "Ver extrato de transações", hasDataScope: true },
                    { module: "admin.financial.transactions", action: "create", label: "Criar Lançamento", description: "Registrar receitas e despesas" },
                    { module: "admin.financial.transactions", action: "edit", label: "Editar", description: "Alterar lançamentos" },
                    { module: "admin.financial.transactions", action: "delete", label: "Excluir", description: "Remover lançamentos" },
                    { module: "admin.financial.transactions", action: "approve", label: "Aprovar / Conciliar", description: "Aprovar transações pendentes" },
                    { module: "admin.financial.transactions", action: "export", label: "Exportar", description: "Exportar extratos" },
                ],
            },
            {
                name: "Cartões",
                icon: <CreditCard size={16} />,
                permissions: [
                    { module: "admin.financial.cards", action: "view", label: "Visualizar", description: "Ver cartões cadastrados" },
                    { module: "admin.financial.cards", action: "create", label: "Criar", description: "Cadastrar novos cartões" },
                    { module: "admin.financial.cards", action: "edit", label: "Editar", description: "Alterar dados de cartões" },
                    { module: "admin.financial.cards", action: "delete", label: "Excluir", description: "Remover cartões" },
                ],
            },
            {
                name: "Nota Fiscal",
                icon: <Receipt size={16} />,
                permissions: [
                    { module: "admin.financial.invoices", action: "view", label: "Visualizar", description: "Ver notas fiscais emitidas" },
                    { module: "admin.financial.invoices", action: "create", label: "Emitir", description: "Emitir novas notas fiscais" },
                    { module: "admin.financial.invoices", action: "cancel", label: "Cancelar", description: "Cancelar notas emitidas" },
                    { module: "admin.financial.invoices", action: "export", label: "Exportar XML/PDF", description: "Baixar XML ou PDF de notas" },
                ],
            },
            {
                name: "Calendário Financeiro",
                icon: <Calendar size={16} />,
                permissions: [
                    { module: "admin.financial.calendar", action: "view", label: "Visualizar", description: "Ver vencimentos e programações" },
                    { module: "admin.financial.calendar", action: "manage", label: "Gerenciar", description: "Adicionar e alterar eventos" },
                ],
            },
            {
                name: "Distribuição de Lucros",
                icon: <PieChart size={16} />,
                permissions: [
                    { module: "admin.financial.profit", action: "view", label: "Visualizar", description: "Ver distribuição de lucros" },
                    { module: "admin.financial.profit", action: "manage", label: "Gerenciar", description: "Configurar divisão de lucros" },
                    { module: "admin.financial.profit", action: "approve", label: "Aprovar", description: "Aprovar pagamentos de lucros" },
                ],
            },
            {
                name: "Investimentos / Reserva",
                icon: <PiggyBank size={16} />,
                permissions: [
                    { module: "admin.financial.investments", action: "view", label: "Visualizar", description: "Ver investimentos e reserva" },
                    { module: "admin.financial.investments", action: "manage", label: "Gerenciar", description: "Alocar / retirar valores" },
                ],
            },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: <BarChart3 size={16} />,
        sectionColor: "text-amber-400",
        modules: [
            {
                name: "Metas",
                icon: <Target size={16} />,
                permissions: [
                    { module: "admin.management.goals", action: "view", label: "Visualizar", description: "Ver metas da empresa" },
                    { module: "admin.management.goals", action: "create", label: "Criar", description: "Definir novas metas" },
                    { module: "admin.management.goals", action: "edit", label: "Editar", description: "Alterar metas existentes" },
                    { module: "admin.management.goals", action: "delete", label: "Excluir", description: "Remover metas" },
                ],
            },
            {
                name: "Relatórios",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "admin.management.reports", action: "view", label: "Visualizar", description: "Acessar relatórios gerenciais" },
                    { module: "admin.management.reports", action: "export", label: "Exportar", description: "Exportar relatórios" },
                ],
            },
        ],
    },
    {
        section: "Configurações",
        sectionIcon: <Settings size={16} />,
        sectionColor: "text-slate-400",
        modules: [
            {
                name: "Contas Bancárias",
                icon: <Layers size={16} />,
                permissions: [
                    { module: "admin.settings.accounts", action: "view", label: "Visualizar", description: "Ver contas bancárias" },
                    { module: "admin.settings.accounts", action: "manage", label: "Gerenciar", description: "Criar, editar e excluir contas" },
                ],
            },
            {
                name: "Dados da Empresa",
                icon: <Building2 size={16} />,
                permissions: [
                    { module: "admin.settings.company", action: "view", label: "Visualizar", description: "Ver dados da empresa" },
                    { module: "admin.settings.company", action: "edit", label: "Editar", description: "Alterar dados cadastrais" },
                ],
            },
            {
                name: "Integrações",
                icon: <Link2 size={16} />,
                permissions: [
                    { module: "admin.settings.integrations", action: "view", label: "Visualizar", description: "Ver integrações ativas" },
                    { module: "admin.settings.integrations", action: "manage", label: "Gerenciar", description: "Ativar / desativar integrações" },
                ],
            },
            {
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "admin.settings.users", action: "view", label: "Visualizar", description: "Ver lista de usuários" },
                    { module: "admin.settings.users", action: "create", label: "Criar", description: "Cadastrar novos usuários" },
                    { module: "admin.settings.users", action: "edit", label: "Editar", description: "Alterar dados e permissões" },
                    { module: "admin.settings.users", action: "delete", label: "Excluir", description: "Remover usuários" },
                ],
            },
        ],
    },
];

/* ═══════════════════════════════════════ */
/* HELPERS                                 */
/* ═══════════════════════════════════════ */
interface PermState {
    [key: string]: { enabled: boolean; dataScope: DataScope };
}

function makeKey(module: string, action: string) {
    return `${module}::${action}`;
}

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function EditCorporateUserPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [position, setPosition] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<string>("");

    // Permissions state
    const [perms, setPerms] = useState<PermState>({});

    // Collapsed sections
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api<any>(`/api/users/${resolvedParams.id}`);
                if (res.success && res.data) {
                    const u = res.data;
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setPhone(u.phone || "");
                    setPosition(u.position || "");
                    setRole(u.role || "USER");
                    
                    if (u.permissions && Array.isArray(u.permissions)) {
                        const newPerms: PermState = {};
                        u.permissions.forEach((p: any) => {
                            newPerms[makeKey(p.module, p.action)] = { enabled: true, dataScope: p.dataScope || "OWN" };
                        });
                        setPerms(newPerms);
                    }
                } else {
                    toast.error("Erro ao carregar usuário");
                    router.push("/dashboard/management/settings/users");
                }
            } catch (err) {
                toast.error("Erro de conexão");
            } finally {
                setIsFetching(false);
            }
        };
        fetchUser();
    }, [resolvedParams.id, router, toast]);

    const togglePerm = (module: string, action: string) => {
        const key = makeKey(module, action);
        setPerms((prev) => {
            const current = prev[key];
            if (current?.enabled) {
                const next = { ...prev };
                delete next[key];
                return next;
            }
            return { ...prev, [key]: { enabled: true, dataScope: "OWN" } };
        });
    };

    const setDataScope = (module: string, action: string, scope: DataScope) => {
        const key = makeKey(module, action);
        setPerms((prev) => ({
            ...prev,
            [key]: { enabled: true, dataScope: scope },
        }));
    };

    const toggleAllSection = (group: ModuleGroup) => {
        const allKeys: string[] = [];
        group.modules.forEach((m) =>
            m.permissions.forEach((p) => allKeys.push(makeKey(p.module, p.action)))
        );
        const allEnabled = allKeys.every((k) => perms[k]?.enabled);

        if (allEnabled) {
            setPerms((prev) => {
                const next = { ...prev };
                allKeys.forEach((k) => delete next[k]);
                return next;
            });
        } else {
            setPerms((prev) => {
                const next = { ...prev };
                allKeys.forEach((k) => {
                    if (!next[k]?.enabled) next[k] = { enabled: true, dataScope: "OWN" };
                });
                return next;
            });
        }
    };

    const toggleSectionCollapse = (section: string) => {
        setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const selectAllPermissions = () => {
        const newPerms: PermState = {};
        CORPORATE_PERMISSIONS.forEach((group) => {
            group.modules.forEach((m) => {
                m.permissions.forEach((p) => {
                    newPerms[makeKey(p.module, p.action)] = { enabled: true, dataScope: "ALL" };
                });
            });
        });
        setPerms(newPerms);
    };

    const clearAllPermissions = () => {
        setPerms({});
    };

    const handleSave = async () => {
        setError("");
        if (!name.trim() || !email.trim()) {
            setError("Preencha nome e e-mail.");
            return;
        }
        if (password && password.length < 6) {
            setError("Senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsLoading(true);
        try {
            const permissions = Object.entries(perms)
                .filter(([, v]) => v.enabled)
                .map(([key, v]) => {
                    const [module, action] = key.split("::");
                    return { module, action, dataScope: v.dataScope };
                });
            
            const payload: any = {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim() || null,
                position: position.trim() || null,
                role,
                permissions,
                allowedApps: ["corporate"],
            };
            if (password) {
                payload.password = password;
            }

            const result = await api(`/api/users/${resolvedParams.id}`, {
                method: "PUT",
                body: payload,
            });

            if (result.success) {
                toast.success("Usuário atualizado com sucesso!");
                router.push("/dashboard/management/settings/users");
            } else {
                setError(result.error?.message || "Erro ao atualizar usuário.");
                setIsLoading(false);
            }
        } catch {
            setError("Erro de conexão com o servidor.");
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Carregando dados do usuário...</p>
            </div>
        );
    }

    const enabledCount = Object.values(perms).filter((v) => v.enabled).length;
    const totalCount = CORPORATE_PERMISSIONS.reduce(
        (acc, g) => acc + g.modules.reduce((a, m) => a + m.permissions.length, 0), 0
    );


    const permBarPercent = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/management/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} />
                        <Settings size={14} />
                        <span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/management/settings/users" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        Usuários
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-emerald-400 text-sm font-medium">Editar Usuário</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <UserPlus size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Editar Usuário — Corporate</h1>
                            <p className="text-sm text-slate-400">Admin Hub — Financeiro, Contratos, Gestão e Configurações</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !name || !email}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isLoading ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </motion.div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                    {error}
                </motion.div>
            )}

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ═══ LEFT COLUMN — User Data ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="lg:col-span-5"
                >
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-5 sticky top-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Users size={16} className="text-emerald-500" />
                            Dados Pessoais
                        </h2>

                        {/* Name */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome Completo *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
                                    setName(v.replace(/\b\w/g, (c) => c.toUpperCase()));
                                }}
                                placeholder="Ex: Maria Oliveira"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">E-mail Corporativo *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                placeholder="usuario@mestresdaweb.com.br"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nova Senha (opcional)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres (deixe em branco para manter)"
                                    className="w-full px-4 py-2.5 pr-10 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[11px] p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Phone + Position */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Telefone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                                        let formatted = digits;
                                        if (digits.length > 0) formatted = `(${digits.slice(0, 2)}`;
                                        if (digits.length >= 3) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}`;
                                        if (digits.length >= 8) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
                                        setPhone(formatted);
                                    }}
                                    placeholder="(11) 99999-0000"
                                    maxLength={15}
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cargo</label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Ex: Diretor Financeiro"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Avatar Preview */}
                        <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                                {name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{name || "Nome do Usuário"}</p>
                                <p className="text-xs text-slate-500">{email || "email@mestresdaweb.com.br"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {position && <p className="text-[10px] text-slate-600">{position}</p>}
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                        Corporate
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ RIGHT COLUMN — Permissions ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="lg:col-span-7"
                >
                    {/* Permissions Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-emerald-500" />
                            Permissões — Corporate
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearAllPermissions}
                                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-white transition-all"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={selectAllPermissions}
                                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            >
                                Selecionar Tudo
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Progresso de Permissões
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                {enabledCount}/{totalCount} <span className="text-slate-600">({permBarPercent}%)</span>
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${permBarPercent}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Permission Sections */}
                    <div className="space-y-4">
                        {CORPORATE_PERMISSIONS.map((group) => {
                            const allKeys: string[] = [];
                            group.modules.forEach((m) =>
                                m.permissions.forEach((p) => allKeys.push(makeKey(p.module, p.action)))
                            );
                            const sectionEnabledCount = allKeys.filter((k) => perms[k]?.enabled).length;
                            const allEnabled = sectionEnabledCount === allKeys.length;
                            const isCollapsed = collapsedSections[group.section];

                            return (
                                <div
                                    key={group.section}
                                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden"
                                >
                                    {/* Section Header */}
                                    <div
                                        className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors"
                                        onClick={() => toggleSectionCollapse(group.section)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={group.sectionColor}>{group.sectionIcon}</span>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">{group.section}</h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${sectionEnabledCount === allKeys.length ? "bg-emerald-500/10 text-emerald-400" : sectionEnabledCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-slate-700/50 text-slate-500"}`}>
                                                {sectionEnabledCount}/{allKeys.length}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleAllSection(group); }}
                                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${allEnabled
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-white"
                                                }`}
                                        >
                                            {allEnabled ? "Desativar Tudo" : "Ativar Tudo"}
                                        </button>
                                    </div>

                                    {/* Module Cards — Collapsible */}
                                    {!isCollapsed && (
                                        <div className="divide-y divide-white/[0.03]">
                                            {group.modules.map((mod) => (
                                                <div key={mod.name} className="px-5 py-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-slate-400">{mod.icon}</span>
                                                        <h4 className="text-sm font-semibold text-slate-200">{mod.name}</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mod.permissions.map((perm) => {
                                                            const key = makeKey(perm.module, perm.action);
                                                            const isEnabled = perms[key]?.enabled ?? false;
                                                            const scope = perms[key]?.dataScope ?? "OWN";

                                                            return (
                                                                <div key={key} className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => togglePerm(perm.module, perm.action)}
                                                                        title={perm.description}
                                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isEnabled
                                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                            : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                                            }`}
                                                                    >
                                                                        <div className={`w-3 h-3 rounded-sm border transition-colors ${isEnabled ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                                                                            }`}>
                                                                            {isEnabled && (
                                                                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                                    <path d="M20 6L9 17l-5-5" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                        {perm.label}
                                                                    </button>

                                                                    {perm.hasDataScope && isEnabled && (
                                                                        <select
                                                                            value={scope}
                                                                            onChange={(e) => setDataScope(perm.module, perm.action, e.target.value as DataScope)}
                                                                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg border transition-all appearance-none cursor-pointer ${scope === "ALL"
                                                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                                                                }`}
                                                                        >
                                                                            <option value="OWN">🟡 Próprios</option>
                                                                            <option value="ALL">🟢 Todos</option>
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
