"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
    Home, FolderKanban, ListTodo, FileText, BarChart3, Bell, Settings,
    ChevronLeft, ChevronRight, ChevronDown, LogOut, Package, Menu, X,
} from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useAuthStore } from "@/stores/auth";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [projectsExpanded, setProjectsExpanded] = useState(true);
    const [configExpanded, setConfigExpanded] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // Permission helper: checks if user has at least one permission for a module.
    // OWNER and ADMIN always see all menu items.
    const hasModuleAccess = (moduleKey: string): boolean => {
        if (user?.role === "OWNER" || user?.role === "ADMIN") return true;
        if (!user?.permissions || user.permissions.length === 0) return false;
        return user.permissions.some(p => p.module === moduleKey);
    };

    const canProjects = hasModuleAccess("projects");
    const canBacklog = hasModuleAccess("backlog");
    const canDocuments = hasModuleAccess("documents");
    const canDeliveries = hasModuleAccess("deliveries");
    const canReports = hasModuleAccess("reports");
    const canNotifications = hasModuleAccess("notifications");
    const canSettings = hasModuleAccess("settings") || hasModuleAccess("users");

    const hasAnyProject = canProjects || canBacklog || canDocuments || canDeliveries;
    const hasAnySystem = canNotifications || canSettings;

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [mobileOpen]);

    const navItemBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium";
    const navItemActive = "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20";
    const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/50";

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const sidebarContent = (isMobile: boolean) => (
        <>
            {/* Logo Area */}
            <div className={`flex shrink-0 items-center justify-center border-b border-slate-800 ${collapsed && !isMobile ? 'py-3' : 'py-4'}`}>
                {(!collapsed || isMobile) && (
                    <span className="text-4xl font-bold tracking-tight text-white font-varela-round lowercase">cezani</span>
                )}
                {collapsed && !isMobile && (
                    <span className="text-xl font-bold tracking-tight text-white font-varela-round lowercase">cz</span>
                )}
                {/* Desktop collapse toggle */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="absolute right-[-14px] top-6 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 hidden md:flex z-50 shadow-lg"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}
                {/* Mobile close button */}
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar flex flex-col gap-6">
                {/* Principal – Dashboard always visible */}
                <div className="space-y-1">
                    {(!collapsed || isMobile) && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Principal</div>}
                    <Link href="/dashboard" className={`${navItemBase} ${pathname === '/dashboard' ? navItemActive : navItemInactive}`}>
                        <Home size={20} className={pathname === '/dashboard' ? 'text-blue-400' : 'text-slate-400'} />
                        {(!collapsed || isMobile) && <span>Dashboard</span>}
                    </Link>
                </div>

                {/* Projetos – only if user has access to at least one item */}
                {hasAnyProject && (
                <div className="space-y-1">
                    {(!collapsed || isMobile) && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setProjectsExpanded(!projectsExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Projetos</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${projectsExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(projectsExpanded || (collapsed && !isMobile)) && (
                        <div className="space-y-1">
                            {canProjects && (
                            <Link href="/dashboard/projects" className={`${navItemBase} ${isActive('/dashboard/projects') ? navItemActive : navItemInactive}`}>
                                <FolderKanban size={20} className={isActive('/dashboard/projects') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Todos os Projetos</span>}
                            </Link>
                            )}
                            {canBacklog && (
                            <Link href="/dashboard/backlog" className={`${navItemBase} ${isActive('/dashboard/backlog') ? navItemActive : navItemInactive}`}>
                                <ListTodo size={20} className={isActive('/dashboard/backlog') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Backlog</span>}
                            </Link>
                            )}
                            {canDocuments && (
                            <Link href="/dashboard/documents" className={`${navItemBase} ${isActive('/dashboard/documents') ? navItemActive : navItemInactive}`}>
                                <FileText size={20} className={isActive('/dashboard/documents') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Documentos</span>}
                            </Link>
                            )}
                            {canDeliveries && (
                            <Link href="/dashboard/deliveries" className={`${navItemBase} ${isActive('/dashboard/deliveries') ? navItemActive : navItemInactive}`}>
                                <Package size={20} className={isActive('/dashboard/deliveries') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Entregas</span>}
                            </Link>
                            )}
                        </div>
                    )}
                </div>
                )}

                {/* Gestão – only if user has reports permission */}
                {canReports && (
                    <div className="space-y-1">
                        {(!collapsed || isMobile) && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Gestão</div>}
                        <Link href="/dashboard/reports" className={`${navItemBase} ${isActive('/dashboard/reports') ? navItemActive : navItemInactive}`}>
                            <BarChart3 size={20} className={isActive('/dashboard/reports') ? 'text-blue-400' : 'text-slate-400'} />
                            {(!collapsed || isMobile) && <span>Relatórios Gerenciais</span>}
                        </Link>
                    </div>
                )}

                {/* Sistema – only if user has access to at least one system item */}
                {hasAnySystem && (
                <div className="space-y-1">
                    {(!collapsed || isMobile) && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setConfigExpanded(!configExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Sistema</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${configExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(configExpanded || (collapsed && !isMobile)) && (
                        <div className="space-y-1">
                            {canNotifications && (
                            <Link href="/dashboard/notifications" className={`${navItemBase} ${isActive('/dashboard/notifications') ? navItemActive : navItemInactive}`}>
                                <Bell size={20} className={isActive('/dashboard/notifications') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Notificações</span>}
                            </Link>
                            )}
                            {canSettings && (
                            <Link href="/dashboard/settings" className={`${navItemBase} ${isActive('/dashboard/settings') ? navItemActive : navItemInactive}`}>
                                <Settings size={20} className={isActive('/dashboard/settings') ? 'text-blue-400' : 'text-slate-400'} />
                                {(!collapsed || isMobile) && <span>Configurações</span>}
                            </Link>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                {collapsed && !isMobile ? (
                    <Link href="/dashboard/notifications" className="relative flex items-center justify-center w-full p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1/2 translate-x-3 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900">4</span>
                    </Link>
                ) : (
                    <div className="flex items-center gap-2 px-2">
                        <NotificationBell />
                        <Link href="/dashboard/notifications" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Notificações</Link>
                    </div>
                )}

                {/* User Profile */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-white/[0.06]">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shrink-0 font-bold text-sm overflow-hidden">
                            {user?.avatar ? (
                                <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}${user.avatar}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "U"
                            )}
                        </div>
                        {(!collapsed || isMobile) && (
                            <div className="flex-1 overflow-hidden">
                                <h4 className="text-sm font-bold text-white truncate">{user?.name || "Usuário"}</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{user?.email || ""}</p>
                            </div>
                        )}
                    </Link>
                    {(!collapsed || isMobile) && (
                        <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* ── Mobile Hamburger Button ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-white/[0.06] text-slate-300 hover:text-white shadow-lg md:hidden transition-colors"
                aria-label="Abrir menu"
            >
                <Menu size={22} />
            </button>

            {/* ── Mobile Sidebar Overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[70] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Sidebar */}
                    <aside className="absolute left-0 top-0 h-full w-[280px] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col animate-slide-in-left">
                        {sidebarContent(true)}
                    </aside>
                </div>
            )}

            {/* ── Desktop Sidebar ── */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 z-50 flex-col hidden md:flex ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}
            >
                {sidebarContent(false)}
            </aside>
        </>
    );
}
