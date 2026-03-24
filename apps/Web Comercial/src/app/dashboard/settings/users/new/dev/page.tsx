"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Settings,
    Save,
    Eye,
    EyeOff,
    Users,
    Shield,
    BarChart3,
    Code2,
    FolderKanban,
    ListTodo,
    Package,
    FileText,
    Clock,
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

/* ── Time Dev Permissions ── */
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

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function NewDevUserPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
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
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("Preencha nome, e-mail e senha.");
            return;
        }
        if (!role) {
            setError("Selecione um perfil de acesso.");
            return;
        }
        if (password.length < 6) {
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

            const result = await api("/api/users", {
                method: "POST",
                body: {
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    phone: phone.trim() || null,
                    position: position.trim() || null,
                    role,
                    permissions,
                    allowedApps: ["dev"],
                },
            });

            if (result.success) {
                router.push("/dashboard/settings/users");
            } else {
                setError(result.error?.message || "Erro ao criar usuário.");
                setIsLoading(false);
            }
        } catch {
            setError("Erro de conexão com o servidor.");
            setIsLoading(false);
        }
    };

    const enabledCount = Object.values(perms).filter((v) => v.enabled).length;
    const totalCount = DEV_PERMISSIONS.reduce(
        (acc, g) => acc + g.modules.reduce((a, m) => a + m.permissions.length, 0), 0
    );

    const roleOptions = [
        { value: "OWNER", label: "Proprietário", desc: "Acesso total a todas funcionalidades", icon: <Shield size={16} />, color: "red" },
        { value: "ADMIN", label: "Administrador", desc: "Controle administrativo completo", icon: <Shield size={16} />, color: "orange" },
        { value: "MANAGER", label: "Gestor", desc: "Gerencia projetos e equipe", icon: <BarChart3 size={16} />, color: "purple" },
        { value: "USER", label: "Usuário", desc: "Acesso padrão aos módulos atribuídos", icon: <Users size={16} />, color: "blue" },
        { value: "VIEWER", label: "Visualizador", desc: "Apenas visualização, sem edição", icon: <Eye size={16} />, color: "amber" },
    ];

    const roleColorMap: Record<string, { active: string; inactive: string; icon: string; text: string }> = {
        red: { active: "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-red-400", text: "text-red-400" },
        orange: { active: "bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-orange-400", text: "text-orange-400" },
        purple: { active: "bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-purple-400", text: "text-purple-400" },
        blue: { active: "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-blue-400", text: "text-blue-400" },
        amber: { active: "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20", inactive: "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]", icon: "text-amber-400", text: "text-amber-400" },
    };

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
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} />
                        <Settings size={14} />
                        <span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/settings/users" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        Usuários
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/settings/users/new" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        Novo Usuário
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-blue-400 text-sm font-medium">Time Dev</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Code2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Novo Usuário — Time Dev</h1>
                            <p className="text-sm text-slate-400">Equipe de desenvolvimento — Projetos, Backlog, Documentos e entregas</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !name || !email || !password}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isLoading ? "Salvando..." : "Cadastrar Usuário"}
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
                            <Users size={16} className="text-blue-500" />
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
                                placeholder="Ex: João da Silva"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">E-mail *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                placeholder="usuario@empresa.com.br"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Senha *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-4 py-2.5 pr-10 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cargo</label>
                                <input
                                    type="text"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    placeholder="Ex: Dev Full Stack"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Perfil de Acesso *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {roleOptions.map((opt) => {
                                    const colors = roleColorMap[opt.color];
                                    const isActive = role === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRole(opt.value)}
                                            className={`p-3.5 rounded-xl border text-left transition-all ${isActive ? colors.active : colors.inactive}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
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
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                                {name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{name || "Nome do Usuário"}</p>
                                <p className="text-xs text-slate-500">{email || "email@empresa.com"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {position && <p className="text-[10px] text-slate-600">{position}</p>}
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                        Dev
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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} className="text-blue-500" />
                            Permissões — Time Dev
                        </h2>
                        <span className="text-xs text-slate-500">
                            {enabledCount}/{totalCount} ativas
                        </span>
                    </div>

                    {/* Permission Sections */}
                    <div className="space-y-4">
                        {DEV_PERMISSIONS.map((group) => {
                            const allKeys: string[] = [];
                            group.modules.forEach((m) =>
                                m.permissions.forEach((p) => allKeys.push(makeKey(p.module, p.action)))
                            );
                            const sectionEnabledCount = allKeys.filter((k) => perms[k]?.enabled).length;
                            const allEnabled = sectionEnabledCount === allKeys.length;

                            return (
                                <div
                                    key={group.section}
                                    className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <span className={group.sectionColor}>{group.sectionIcon}</span>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">{group.section}</h3>
                                            <span className="text-[10px] text-slate-600 ml-1">
                                                {sectionEnabledCount}/{allKeys.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => toggleAllSection(group)}
                                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${allEnabled
                                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                    : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-white"
                                                }`}
                                        >
                                            {allEnabled ? "Desativar Tudo" : "Ativar Tudo"}
                                        </button>
                                    </div>

                                    {/* Module Cards */}
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
                                                                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                                            : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                                        }`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-sm border transition-colors ${isEnabled ? "bg-blue-500 border-blue-500" : "border-slate-600"
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
                                                                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
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
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
