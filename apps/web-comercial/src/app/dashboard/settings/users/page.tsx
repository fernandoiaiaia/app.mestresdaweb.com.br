"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Users,
    Search,
    Plus,
    ChevronLeft,
    MoreHorizontal,
    Mail,
    Phone,
    Shield,
    UserCheck,
    UserX,
    Edit3,
    Trash2,
    Send,
    Filter,
    ChevronDown,
    Settings,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

/* ═══════════════════════════════════════ */
/* MOCK DATA                               */
/* ═══════════════════════════════════════ */
type UserRole = "gestor" | "advisor" | "financeiro" | "admin";
type UserStatus = "ativo" | "inativo" | "pendente";

interface ApiUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    position: string | null;
    active: boolean;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
    sessions?: { createdAt: string }[];
}

interface UserView {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string; // "gestor" | "advisor" | "financeiro" | "admin" | etc
    position: string;
    status: UserStatus;
    avatar: string;
    lastAccess: string;
    createdAt: string;
}

const roleLabels: Record<string, string> = {
    MANAGER: "Gestor",
    USER: "Usuário",
    VIEWER: "Visualizador",
    ADMIN: "Administrador",
    OWNER: "Proprietário",
};

const roleBadgeColors: Record<string, string> = {
    MANAGER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    USER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    VIEWER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
    OWNER: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusBadgeColors: Record<UserStatus, string> = {
    ativo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    inativo: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const avatarGradients = [
    "from-blue-600 to-blue-400",
    "from-blue-600 to-cyan-400",
    "from-purple-600 to-violet-400",
    "from-amber-600 to-yellow-400",
    "from-rose-600 to-pink-400",
    "from-teal-600 to-blue-400",
    "from-indigo-600 to-blue-400",
    "from-orange-600 to-amber-400",
];

/* ═══════════════════════════════════════ */
/* COMPONENT                               */
/* ═══════════════════════════════════════ */
export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"todos" | "admins" | "advisors" | "devs" | "clientes">("todos");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click (avoids z-index stacking context issues)
    useEffect(() => {
        if (!activeMenu) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setActiveMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [activeMenu]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api<ApiUser[]>("/api/users");
            if (res && res.success && res.data) {
                const mapped: UserView[] = res.data.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone || "",
                    role: u.role,
                    position: u.position || "Não informado",
                    status: u.active ? "ativo" : "inativo",
                    avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
                    lastAccess: u.sessions && u.sessions.length > 0
                        ? new Date(u.sessions[0].createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "Nunca",
                    createdAt: new Date(u.createdAt).toLocaleDateString("pt-BR"),
                }));
                setUsers(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            // Fallback or show error state handled naturally by empty array
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Filtering
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.position.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;
        
        if (!matchesSearch || !matchesRole || !matchesStatus) return false;

        const isDev = user.email === "fcesarf@hotmail.com" || 
            (user.position && (
                user.position.toLowerCase().includes("dev") || 
                user.position.toLowerCase().includes("programador") ||
                user.position.toLowerCase().includes("tech") ||
                user.position.toLowerCase().includes("fullstack") ||
                user.position.toLowerCase().includes("engenheiro")
            ));

        if (activeTab === "admins" && user.role !== "ADMIN" && user.role !== "OWNER") return false;
        if (activeTab === "advisors" && (user.role !== "MANAGER" && user.role !== "USER" || isDev)) return false;
        if (activeTab === "clientes" && user.role !== "VIEWER") return false;
        if (activeTab === "devs" && !isDev) return false;

        return true;
    });

    const activeCounts = {
        total: users.length,
        admins: users.filter(u => u.role === "ADMIN" || u.role === "OWNER").length,
        advisors: users.filter(u => (u.role === "MANAGER" || u.role === "USER") && !(u.email === "fcesarf@hotmail.com" || (u.position && (u.position.toLowerCase().includes("dev") || u.position.toLowerCase().includes("programador") || u.position.toLowerCase().includes("tech") || u.position.toLowerCase().includes("fullstack") || u.position.toLowerCase().includes("engenheiro"))))).length,
        devs: users.filter(u => u.email === "fcesarf@hotmail.com" || (u.position && (u.position.toLowerCase().includes("dev") || u.position.toLowerCase().includes("programador") || u.position.toLowerCase().includes("tech") || u.position.toLowerCase().includes("fullstack") || u.position.toLowerCase().includes("engenheiro")))).length,
        clientes: users.filter(u => u.role === "VIEWER").length,
    };

    const counts = {
        total: users.length,
        ativo: users.filter((u) => u.status === "ativo").length,
        inativo: users.filter((u) => u.status === "inativo").length,
        pendente: users.filter((u) => u.status === "pendente").length,
    };


    const toggleStatus = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const newActiveStatus = user.status === "inativo";
        const res = await api(`/api/users/${userId}`, {
            method: "PUT",
            body: { active: newActiveStatus }
        });

        if (res.success) {
            setUsers((prev) =>
                prev.map((u) => u.id === userId ? { ...u, status: newActiveStatus ? "ativo" : "inativo" } : u)
            );
            toast.success(newActiveStatus ? "Usuário ativado com sucesso" : "Usuário desativado com sucesso");
        } else {
            toast.error(res.error?.message || "Erro ao alterar status do usuário");
        }
        setActiveMenu(null);
    };

    const deleteUser = async (userId: string) => {
        const res = await api(`/api/users/${userId}`, { method: "DELETE" });
        if (res.success) {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            toast.success("Usuário excluído com sucesso");
        } else {
            toast.error(res.error?.message || "Erro ao excluir usuário");
        }
        setShowDeleteConfirm(null);
        setActiveMenu(null);
    };

    const resendInvite = async (userId: string) => {
        setActiveMenu(null);
        try {
            const res = await api(`/api/users/${userId}/resend-invite`, { method: "POST" });
            if (res.success) {
                toast.success("Convite reenviado com sucesso!");
            } else {
                toast.error(res.error?.message || "Erro ao reenviar convite");
            }
        } catch {
            toast.error("Erro de conexão ao reenviar convite");
        }
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
                    <span className="text-slate-300 text-sm font-medium">Usuários</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Usuários</h1>
                            <p className="text-sm text-slate-400">Cadastre e gerencie advisors, gestores e acessos</p>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/settings/users/new"
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                    >
                        <Plus size={18} />
                        Novo Usuário
                    </Link>
                </div>
            </motion.div>

            {/* Top Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-1 p-1 bg-slate-800/40 border border-white/[0.06] rounded-xl mb-6 overflow-x-auto w-fit max-w-full"
            >
                {[
                    { id: "todos", label: "Todos os Usuários", count: activeCounts.total },
                    { id: "admins", label: "Administradores", count: activeCounts.admins },
                    { id: "advisors", label: "Advisors / Vendas", count: activeCounts.advisors },
                    { id: "devs", label: "Time Dev", count: activeCounts.devs },
                    { id: "clientes", label: "Clientes (Portal)", count: activeCounts.clientes },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {[
                    { label: "Total", value: counts.total, color: "text-white", bg: "bg-slate-700/30" },
                    { label: "Ativos", value: counts.ativo, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Inativos", value: counts.inativo, color: "text-slate-400", bg: "bg-slate-500/10" },
                    { label: "Pendentes", value: counts.pendente, color: "text-amber-400", bg: "bg-amber-500/10" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-xl p-4">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">{stat.label}</span>
                        <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </motion.div>

            {/* Search + Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, e-mail ou cargo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${showFilters ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800/50 border-white/[0.08] text-slate-400 hover:text-white'}`}
                    >
                        <Filter size={16} />
                        Filtros
                        {(roleFilter !== "all" || statusFilter !== "all") && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                    </button>
                </div>

                {/* Expanded Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-3 mt-3 p-4 bg-slate-800/30 border border-white/[0.04] rounded-xl">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Perfil</label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as any)}
                                        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[150px]"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="MANAGER">Gestor</option>
                                        <option value="USER">Advisor</option>
                                        <option value="VIEWER">Visualizador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/40 min-w-[150px]"
                                    >
                                        <option value="all">Todos</option>
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                        <option value="pendente">Pendente</option>
                                    </select>
                                </div>
                                {(roleFilter !== "all" || statusFilter !== "all") && (
                                    <button
                                        onClick={() => { setRoleFilter("all"); setStatusFilter("all"); }}
                                        className="self-end px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl"
            >
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Usuário</span>
                    <span>Perfil</span>
                    <span>Status</span>
                    <span>Último Acesso</span>
                    <span className="w-10" />
                </div>

                {/* Table Body */}
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Users size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-medium">Nenhum usuário encontrado</p>
                        <p className="text-xs text-slate-600 mt-1">Tente ajustar os filtros ou a busca</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.04]">
                        {filteredUsers.map((user, index) => (
                            <div
                                key={user.id}
                                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group items-center"
                            >
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatarGradients[index % avatarGradients.length]} flex items-center justify-center text-white font-bold text-sm shrink-0 ${user.status === "inativo" ? "opacity-40" : ""}`}>
                                        {user.avatar}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className={`text-sm font-semibold truncate ${user.status === "inativo" ? "text-slate-500" : "text-white"}`}>{user.name}</h4>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                            <span className="flex items-center gap-1 truncate">
                                                <Mail size={11} />
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadgeColors[user.role] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                        {roleLabels[user.role] || user.role}
                                    </span>
                                </div>

                                {/* Status */}
                                <div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadgeColors[user.status]}`}>
                                        {user.status === "ativo" ? "Ativo" : user.status === "inativo" ? "Inativo" : "Pendente"}
                                    </span>
                                </div>

                                {/* Last Access */}
                                <div>
                                    <span className="text-xs text-slate-500">{user.lastAccess}</span>
                                </div>

                                {/* Actions */}
                                <div ref={activeMenu === user.id ? menuRef : undefined} className="relative w-10 flex items-center justify-center">
                                    <button
                                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {activeMenu === user.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-white/10 rounded-xl shadow-2xl shadow-black/40 z-[100] overflow-hidden py-1"
                                            >
                                                <Link
                                                    href={`/dashboard/settings/users/${user.id}/edit`}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                >
                                                    <Edit3 size={15} />
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => toggleStatus(user.id)}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                >
                                                    {user.status === "ativo" ? <UserX size={15} /> : <UserCheck size={15} />}
                                                    {user.status === "ativo" ? "Desativar" : "Ativar"}
                                                </button>
                                                {user.status === "pendente" && (
                                                    <button
                                                        onClick={() => resendInvite(user.id)}
                                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                                    >
                                                        <Send size={15} />
                                                        Reenviar Convite
                                                    </button>
                                                )}
                                                <div className="h-px bg-white/[0.06] my-1" />
                                                <button
                                                    onClick={() => { setShowDeleteConfirm(user.id); setActiveMenu(null); }}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                    Excluir
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Results count */}
            <div className="mt-4 text-xs text-slate-600 text-center">
                Exibindo {filteredUsers.length} de {users.length} usuários
            </div>


            {/* ═══ DELETE CONFIRM MODAL ═══ */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={22} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center mb-2">Excluir Usuário</h3>
                            <p className="text-sm text-slate-400 text-center mb-6">
                                Esta ação é irreversível. O usuário perderá todo acesso ao sistema.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => deleteUser(showDeleteConfirm)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    Excluir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}
