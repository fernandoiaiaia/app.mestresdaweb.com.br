"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Save,
    Users,
    Shield,
    Loader2,
    Code2,
    TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    type PermState,
    makeKey,
    buildActivePermissions,
    detectTeam,
    teamLabel,
    accentColor,
    APP_OPTIONS,
    TEAM_BADGE,
} from "../../_permissions";

interface UserData {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    role?: string;
    active?: boolean;
    allowedApps?: string[];
    allowedFunnels?: string[];
    permissions?: Array<{ module: string; action: string; dataScope?: "OWN" | "ALL" }>;
}

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
    const [allowedApps, setAllowedApps] = useState<string[]>(["growth"]);

    // Permissions state
    const [perms, setPerms] = useState<PermState>({});
    const [funnels, setFunnels] = useState<{ id: string; name: string }[]>([]);
    const [allowedFunnels, setAllowedFunnels] = useState<string[]>([]);

    useEffect(() => {
        const fetchFunnels = async () => {
            try {
                const res = await api<{ id: string; name: string }[]>("/api/funnels");
                if (res.data) setFunnels(res.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchFunnels();
    }, []);

    const userTeam = detectTeam(allowedApps);
    const activePermissions = buildActivePermissions(allowedApps);
    const currentTeamLabel = teamLabel(userTeam);
    const currentAccent = accentColor(userTeam);

    useEffect(() => {
        async function loadUser() {
            try {
                const result = await api(`/api/users/${resolvedParams.id}`);
                if (result.success && result.data) {
                    const u = result.data as UserData;
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setPhone(u.phone || "");
                    setPosition(u.position || "");
                    setRole(u.role || "USER");
                    setActive(u.active ?? true);
                    setAllowedFunnels(u.allowedFunnels || []);
                    const apps = u.allowedApps?.length ? u.allowedApps : ["growth"];
                    setAllowedApps(apps);

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

    const setDataScope = (module: string, action: string, scope: "OWN" | "ALL") => {
        const key = makeKey(module, action);
        setPerms((prev) => ({
            ...prev,
            [key]: { enabled: true, dataScope: scope },
        }));
    };

    const toggleAllSection = (group: (typeof activePermissions)[number]) => {
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
                    allowedFunnels,
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
        (acc, g) => acc + g.modules.reduce((a, m) => a + m.permissions.length, 0),
        0
    );

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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
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
                        <div className={`w-10 h-10 rounded-xl bg-${currentAccent}-500/10 border border-${currentAccent}-500/20 flex items-center justify-center`}>
                            {userTeam === "dev" ? <Code2 size={20} className="text-blue-500" /> : <TrendingUp size={20} className={`text-${currentAccent}-500`} />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Editar Usuário</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm text-slate-400">{name || "..."} — {email || "..."}</p>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${userTeam === "dev" ? "bg-blue-500/10 text-blue-400" : userTeam === "both" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>
                                    {currentTeamLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActive(!active)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${active
                                ? `bg-${currentAccent}-500/10 border-${currentAccent}-500/20 text-${currentAccent}-400`
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                        >
                            {active ? "Ativo" : "Inativo"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !name || !email}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-${currentAccent}-600 hover:bg-${currentAccent}-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-${currentAccent}-600/20`}
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </div>
            </motion.div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 rounded-lg mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-5">
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-5 sticky top-6">
                        <h2 className={`text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2`}>
                            <Users size={16} className={`text-${currentAccent}-500`} />
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
                                className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${currentAccent}-500/40 focus:ring-1 focus:ring-${currentAccent}-500/20 transition-all`}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">E-mail *</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${currentAccent}-500/40 focus:ring-1 focus:ring-${currentAccent}-500/20 transition-all`} />
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
                                    className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${currentAccent}-500/40 focus:ring-1 focus:ring-${currentAccent}-500/20 transition-all`}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cargo</label>
                                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Ex: Dev Full Stack" className={`w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-${currentAccent}-500/40 focus:ring-1 focus:ring-${currentAccent}-500/20 transition-all`} />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Aplicativos</label>
                            <div className="grid grid-cols-3 gap-3">
                                {APP_OPTIONS.map((app) => {
                                    const isActive = allowedApps.includes(app.value);
                                    return (
                                        <button
                                            key={app.value}
                                            type="button"
                                            onClick={() => {
                                                setAllowedApps((prev) => {
                                                    const next = prev.includes(app.value)
                                                        ? prev.filter((a) => a !== app.value)
                                                        : [...prev, app.value];
                                                    if (next.length === 0) return prev;
                                                    setPerms({});
                                                    return next;
                                                });
                                            }}
                                            className={`p-3 rounded-xl border text-center transition-all ${isActive
                                                ? `bg-${app.color}-500/10 border-${app.color}-500/30 ring-1 ring-${app.color}-500/20`
                                                : "bg-slate-800/50 border-white/[0.06] hover:border-white/[0.12]"
                                            }`}
                                        >
                                            <span className={`text-sm font-bold ${isActive ? `text-${app.color}-400` : "text-slate-300"}`}>{app.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${userTeam === "dev" ? "from-blue-600 to-cyan-400" : userTeam === "both" ? "from-purple-600 to-pink-400" : "from-blue-600 to-blue-400"} flex items-center justify-center text-white font-bold text-lg`}>
                                {name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{name || "Nome"}</p>
                                <p className="text-xs text-slate-500">{email || "email"}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {position && <p className="text-[10px] text-slate-600">{position}</p>}
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${userTeam === "dev" ? "bg-blue-500/10 text-blue-400" : userTeam === "both" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>
                                        {currentTeamLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="lg:col-span-7">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className={`text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2`}>
                                <Shield size={16} className={`text-${currentAccent}-500`} />
                                Permissões — {currentTeamLabel}
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
                                <div key={`${group.team}-${group.section}`} className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                                        <div className="flex items-center gap-2">
                                            <span className={group.sectionColor}>{group.sectionIcon}</span>
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-white">{group.section}</h3>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${TEAM_BADGE[group.team].className}`}>{TEAM_BADGE[group.team].label}</span>
                                            <span className="text-[10px] text-slate-600 ml-1">{sectionEnabledCount}/{allKeys.length}</span>
                                        </div>
                                        <button
                                            onClick={() => toggleAllSection(group)}
                                            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${allEnabled
                                                ? `bg-${currentAccent}-500/10 border-${currentAccent}-500/20 text-${currentAccent}-400`
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
                                                                        ? `bg-${currentAccent}-500/10 border-${currentAccent}-500/20 text-${currentAccent}-400`
                                                                        : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                                    }`}
                                                                >
                                                                    <div className={`w-3 h-3 rounded-sm border transition-colors ${isEnabled ? `bg-${currentAccent}-500 border-${currentAccent}-500` : "border-slate-600"}`}>
                                                                        {isEnabled && (
                                                                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                                        )}
                                                                    </div>
                                                                    {perm.label}
                                                                </button>

                                                                {perm.hasDataScope && isEnabled && (
                                                                    <select
                                                                        value={scope}
                                                                        onChange={(e) => setDataScope(perm.module, perm.action, e.target.value as "OWN" | "ALL")}
                                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg border transition-all appearance-none cursor-pointer ${scope === "ALL"
                                                                            ? `bg-${currentAccent}-500/10 border-${currentAccent}-500/20 text-${currentAccent}-400`
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

                                                {mod.name === "Pipeline" && (perms[makeKey("crm.pipeline", "view")]?.enabled || perms[makeKey("crm.pipeline", "manage")]?.enabled) && (
                                                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Funis Permitidos</label>
                                                            <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Opcional</span>
                                                        </div>
                                                        {funnels.length === 0 ? (
                                                            <div className="text-xs text-slate-500 italic">Nenhum funil cadastrado.</div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {funnels.map((f) => {
                                                                    const isSelected = allowedFunnels.includes(f.id);
                                                                    return (
                                                                        <button
                                                                            key={f.id}
                                                                            type="button"
                                                                            onClick={() => setAllowedFunnels((prev) => isSelected ? prev.filter((v) => v !== f.id) : [...prev, f.id])}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected
                                                                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                                                                : "bg-slate-800/50 border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                                            }`}
                                                                        >
                                                                            {f.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                                            Se nenhum funil for selecionado, os funis exibidos dependerão das permissões de &quot;Visualizar&quot; e &quot;Próprios/Todos&quot;. Selecionar um funil aqui força o acesso a ele.
                                                        </p>
                                                    </div>
                                                )}
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
