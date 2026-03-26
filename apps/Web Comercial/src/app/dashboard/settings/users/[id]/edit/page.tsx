"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Settings,
    Edit3,
    Save,
    Eye,
    EyeOff,
    Home,
    Users,
    Kanban,
    Target,
    FileText,
    FolderOpen,
    PlusCircle,
    CheckSquare,
    BarChart3,
    Clock,
    Shield,
    Zap,
    Loader2,
    Code2,
    FolderKanban,
    ListTodo,
    Package,
    TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════ */
/* PERMISSION DEFINITIONS                  */
/* ═══════════════════════════════════════ */
type DataScope = "OWN" | "ALL";

interface PermissionDef {
    module: string;
    action: string;
    label: string;
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

/* ── Growth (Commercial) Permissions ── */
const GROWTH_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Principal",
        sectionIcon: <Home size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Dashboard",
                icon: <Home size={16} />,
                permissions: [
                    { module: "dashboard", action: "view", label: "Visualizar", hasDataScope: true },
                ],
            },
        ],
    },
    {
        section: "CRM",
        sectionIcon: <Users size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Clientes",
                icon: <Users size={16} />,
                permissions: [
                    { module: "crm.clients", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.clients", action: "create", label: "Criar" },
                    { module: "crm.clients", action: "edit", label: "Editar" },
                    { module: "crm.clients", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Pipeline",
                icon: <Kanban size={16} />,
                permissions: [
                    { module: "crm.pipeline", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.pipeline", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Oportunidades",
                icon: <Target size={16} />,
                permissions: [
                    { module: "crm.opportunities", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.opportunities", action: "create", label: "Criar" },
                    { module: "crm.opportunities", action: "edit", label: "Editar" },
                ],
            },
        ],
    },
    {
        section: "Propostas",
        sectionIcon: <FileText size={16} />,
        sectionColor: "text-violet-400",
        modules: [
            {
                name: "Propostas",
                icon: <FolderOpen size={16} />,
                permissions: [
                    { module: "crm.proposals", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.proposals", action: "create", label: "Criar" },
                    { module: "crm.proposals", action: "edit", label: "Editar" },
                    { module: "crm.proposals", action: "send", label: "Enviar" },
                ],
            },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: <Settings size={16} />,
        sectionColor: "text-amber-400",
        modules: [
            {
                name: "Fila de Aprovação",
                icon: <CheckSquare size={16} />,
                permissions: [
                    { module: "manager.queue", action: "view", label: "Visualizar" },
                    { module: "manager.queue", action: "approve", label: "Aprovar/Reprovar" },
                ],
            },
            {
                name: "Relatórios",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "manager.reports", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Log de Atividades",
                icon: <Clock size={16} />,
                permissions: [
                    { module: "manager.activity", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Configurações",
                icon: <Settings size={16} />,
                permissions: [
                    { module: "settings", action: "view", label: "Visualizar" },
                    { module: "settings", action: "edit", label: "Editar" },
                ],
            },
            {
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "settings.users", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
];

/* ── Dev Permissions ── */
const DEV_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Projetos",
        sectionIcon: <FolderKanban size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Projetos",
                icon: <FolderKanban size={16} />,
                permissions: [
                    { module: "projects", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "projects", action: "create", label: "Criar" },
                    { module: "projects", action: "edit", label: "Editar" },
                    { module: "projects", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Backlog",
                icon: <ListTodo size={16} />,
                permissions: [
                    { module: "backlog", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "backlog", action: "create", label: "Criar" },
                    { module: "backlog", action: "edit", label: "Editar" },
                    { module: "backlog", action: "delete", label: "Excluir" },
                ],
            },
        ],
    },
    {
        section: "Documentos & Entregas",
        sectionIcon: <FileText size={16} />,
        sectionColor: "text-purple-400",
        modules: [
            {
                name: "Documentos",
                icon: <FileText size={16} />,
                permissions: [
                    { module: "documents", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "documents", action: "create", label: "Criar" },
                    { module: "documents", action: "edit", label: "Editar" },
                    { module: "documents", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Entregas",
                icon: <Package size={16} />,
                permissions: [
                    { module: "deliveries", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "deliveries", action: "create", label: "Criar" },
                    { module: "deliveries", action: "edit", label: "Editar" },
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
                name: "Relatórios",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "dev.reports", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Timesheet",
                icon: <Clock size={16} />,
                permissions: [
                    { module: "dev.timesheet", action: "view", label: "Visualizar" },
                    { module: "dev.timesheet", action: "manage", label: "Gerenciar" },
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
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "dev.settings.users", action: "manage", label: "Gerenciar" },
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

type UserTeam = "dev" | "growth" | "both";

function detectTeam(allowedApps: string[]): UserTeam {
    const hasDev = allowedApps.includes("dev");
    const hasGrowth = allowedApps.includes("growth");
    if (hasDev && hasGrowth) return "both";
    if (hasDev) return "dev";
    return "growth";
}

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [position, setPosition] = useState("");
    const [role, setRole] = useState<string>("USER");
    const [active, setActive] = useState(true);
    const [allowedApps, setAllowedApps] = useState<string[]>([]);
    const [userTeam, setUserTeam] = useState<UserTeam>("growth");

    // Permissions state
    const [perms, setPerms] = useState<PermState>({});

    // Determine which permissions to show based on team
    const activePermissions = userTeam === "dev" ? DEV_PERMISSIONS
        : userTeam === "both" ? [...DEV_PERMISSIONS, ...GROWTH_PERMISSIONS]
        : GROWTH_PERMISSIONS;

    const teamLabel = userTeam === "dev" ? "Time Dev" : userTeam === "both" ? "Time Dev + Comercial" : "Time Comercial";
    const teamColor = userTeam === "dev" ? "blue" : userTeam === "both" ? "purple" : "green";
    const accentColor = userTeam === "dev" ? "blue" : "green";

    // Load user data
    useEffect(() => {
        async function loadUser() {
            try {
                const result = await api<any>(`/api/users/${resolvedParams.id}`);
                if (result.success && result.data) {
                    const u = result.data;
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setPhone(u.phone || "");
                    setPosition(u.position || "");
                    setRole(u.role || "USER");
                    setActive(u.active ?? true);
                    setAllowedApps(u.allowedApps || []);
                    setUserTeam(detectTeam(u.allowedApps || []));

                    // Load permissions into state
                    const permState: PermState = {};
                    if (u.permissions) {
                        for (const p of u.permissions) {
                            permState[makeKey(p.module, p.action)] = {
                                enabled: true,
                                dataScope: p.dataScope || "OWN",
                            };
                        }
                    }
                    setPerms(permState);
                }
            } catch {
                setError("Erro ao carregar usuário.");
            } finally {
                setIsFetching(false);
            }
        }
        loadUser();
    }, [resolvedParams.id]);

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

    const handleSave = async () => {
        setError("");
        if (!name.trim() || !email.trim()) {
            setError("Preencha nome e e-mail.");
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

            const result = await api(`/api/users/${resolvedParams.id}`, {
                method: "PUT",
                body: {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || null,
                    position: position.trim() || null,
                    role,
                    active,
                    allowedApps,
                    permissions,
                },
            });

            if (result.success) {
                router.push("/dashboard/settings/users");
            } else {
                setError(result.error?.message || "Erro ao salvar.");
                setIsLoading(false);
            }
        } catch {
            setError("Erro de conexão com o servidor.");
            setIsLoading(false);
        }
    };

    const enabledCount = Object.values(perms).filter((v) => v.enabled).length;
    const totalCount = activePermissions.reduce(
        (acc, g) => acc + g.modules.reduce((a, m) => a + m.permissions.length, 0), 0
    );

    const roleOptions = [
        { value: "OWNER", label: "Proprietário", desc: "Acesso total", icon: <Shield size={16} />, color: "red" },
        { value: "ADMIN", label: "Administrador", desc: "Controle administrativo", icon: <Shield size={16} />, color: "orange" },
        { value: "MANAGER", label: "Gestor", desc: "Gerencia equipe", icon: <BarChart3 size={16} />, color: "purple" },
        { value: "USER", label: "Usuário", desc: "Acesso padrão", icon: <Users size={16} />, color: "blue" },
        { value: "VIEWER", label: "Visualizador", desc: "Apenas visualização", icon: <Eye size={16} />, color: "amber" },
    ];

    const roleColorMap: Record<string, { active: string; inactive: string; icon: string; text: string }> = {
        red: { active: "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-red-400", text: "text-red-400" },
        orange: { active: "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-orange-400", text: "text-orange-400" },
        purple: { active: "bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-purple-400", text: "text-purple-400" },
        blue: { active: "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-blue-400", text: "text-blue-400" },
        amber: { active: "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-amber-400", text: "text-amber-400" },
    };

    if (isFetching) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                    <span className="text-sm text-slate-500">Carregando usuário...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings/users" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} />
                        <Users size={14} />
                        <span>Usuários</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Editar</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${accentColor}-500/10 border border-${accentColor}-500/20 flex items-center justify-center`}>
                            {userTeam === "dev" ? <Code2 size={20} className="text-blue-500" /> : <TrendingUp size={20} className="text-blue-500" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Editar Usuário</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm text-slate-400">{name || "..."} — {email || "..."}</p>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    userTeam === "dev" ? "bg-blue-500/10 text-blue-400" 
                                    : userTeam === "both" ? "bg-purple-500/10 text-purple-400"
                                    : "bg-blue-500/10 text-blue-400"
                                }`}>
                                    {teamLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Active Toggle */}
                        <button
                            onClick={() => setActive(!active)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${active
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                }`}
                        >
                            {active ? "Ativo" : "Inativo"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !name || !email}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-${accentColor}-600 hover:bg-${accentColor}-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-${accentColor}-600/20`}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </motion.div>
            )}

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT — User Data */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-5">
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-5 sticky top-6">
                        <h2 className={`text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2`}>
                            <Users size={16} className={`text-${accentColor}-500`} />
                            Dados Pessoais
                        </h2>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome Completo *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
                                    setName(v.replace(/\b\w/g, (c) => c.toUpperCase()));
                                }}
                                className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${accentColor}-500/40 focus:ring-1 focus:ring-${accentColor}-500/20 transition-all`}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">E-mail *</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${accentColor}-500/40 focus:ring-1 focus:ring-${accentColor}-500/20 transition-all`} />
                        </div>

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
                                    className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${accentColor}-500/40 focus:ring-1 focus:ring-${accentColor}-500/20 transition-all`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cargo</label>
                                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Dev Full Stack" className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${accentColor}-500/40 focus:ring-1 focus:ring-${accentColor}-500/20 transition-all`} />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Perfil de Acesso</label>
                            <div className="grid grid-cols-2 gap-3">
                                {roleOptions.map((opt) => {
                                    const colors = roleColorMap[opt.color];
                                    const isActive = role === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRole(opt.value)}
                                            className={`p-3 rounded-xl border text-left transition-all ${isActive ? colors.active : colors.inactive}`}
                                        >
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={isActive ? colors.icon : "text-slate-500"}>{opt.icon}</span>
                                                <span className={`text-sm font-bold ${isActive ? colors.text : "text-slate-300"}`}>{opt.label}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">{opt.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Avatar Preview */}
                        <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${userTeam === "dev" ? "from-blue-600 to-cyan-400" : "from-blue-600 to-blue-400"} flex items-center justify-center text-white font-bold text-lg`}>
                                {name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{name || "Nome"}</p>
                                <p className="text-xs text-slate-500">{email || "email"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {position && <p className="text-[10px] text-slate-600">{position}</p>}
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                        userTeam === "dev" ? "bg-blue-500/10 text-blue-400" 
                                        : userTeam === "both" ? "bg-purple-500/10 text-purple-400"
                                        : "bg-blue-500/10 text-blue-400"
                                    }`}>
                                        {teamLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT — Permissions */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="lg:col-span-7">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className={`text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2`}>
                                <Shield size={16} className={`text-${accentColor}-500`} />
                                Permissões — {teamLabel}
                            </h2>
                            <span className="text-xs text-slate-500">{enabledCount}/{totalCount} ativas</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activePermissions.map((group) => {
                            const allKeys: string[] = [];
                            group.modules.forEach((m) => m.permissions.forEach((p) => allKeys.push(makeKey(p.module, p.action))));
                            const sectionEnabledCount = allKeys.filter((k) => perms[k]?.enabled).length;
                            const allEnabled = sectionEnabledCount === allKeys.length;

                            return (
                                <div key={group.section} className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <span className={group.sectionColor}>{group.sectionIcon}</span>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">{group.section}</h3>
                                            <span className="text-[10px] text-slate-600 ml-1">{sectionEnabledCount}/{allKeys.length}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleAllSection(group)}
                                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${allEnabled
                                                ? `bg-${accentColor}-500/10 border-${accentColor}-500/20 text-${accentColor}-400`
                                                : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-white"
                                            }`}
                                        >
                                            {allEnabled ? "Desativar Tudo" : "Ativar Tudo"}
                                        </button>
                                    </div>

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
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isEnabled
                                                                        ? `bg-${accentColor}-500/10 border-${accentColor}-500/20 text-${accentColor}-400`
                                                                        : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                                    }`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-sm border transition-colors ${isEnabled ? `bg-${accentColor}-500 border-${accentColor}-500` : "border-slate-600"}`}>
                                                                        {isEnabled && (
                                                                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                                        )}
                                                                    </div>
                                                                    {perm.label}
                                                                </button>
                                                                {perm.hasDataScope && isEnabled && (
                                                                    <select
                                                                        value={scope}
                                                                        onChange={(e) => setDataScope(perm.module, perm.action, e.target.value as DataScope)}
                                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg border transition-all appearance-none cursor-pointer ${scope === "ALL" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
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
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
