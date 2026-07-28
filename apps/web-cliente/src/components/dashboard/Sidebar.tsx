"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
    Home,
    FolderKanban,
    Kanban,
    FileText,
    Package,
    ScrollText,
    Bell,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const navItemBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium";
    const navItemActive = "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20";
    const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/50";

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}
        >
            {/* Logo Area */}
            <div className={`flex shrink-0 items-center justify-center border-b border-slate-800 ${collapsed ? 'py-3' : 'py-4'}`}>
                {!collapsed && (
                    <img src="/branding/logo-mdw.png" alt="Mestres da Web" className="w-full max-w-[180px] h-auto object-contain" />
                )}
                {collapsed && (
                    <span className="text-xl font-bold tracking-tight text-white font-varela-round lowercase">cz</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute right-[-14px] top-6 p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 hidden md:flex z-50 shadow-lg"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar flex flex-col gap-6">

                {/* Principal */}
                <div className="space-y-1">
                    {!collapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Principal</div>}
                    <Link id="tour-sidebar-dashboard" href="/dashboard" className={`${navItemBase} ${pathname === '/dashboard' ? navItemActive : navItemInactive}`}>
                        <Home size={20} className={pathname === '/dashboard' ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Dashboard</span>}
                    </Link>
                </div>

                {/* Projetos */}
                <div className="space-y-1">
                    {!collapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Projetos</div>}
                    <Link id="tour-sidebar-projects" href="/dashboard/projects" className={`${navItemBase} ${pathname === '/dashboard/projects' ? navItemActive : navItemInactive}`}>
                        <FolderKanban size={20} className={pathname === '/dashboard/projects' ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Todos os Projetos</span>}
                    </Link>

                    <Link id="tour-sidebar-documents" href="/dashboard/projects/documents" className={`${navItemBase} ${pathname.includes('/projects/documents') ? navItemActive : navItemInactive}`}>
                        <FileText size={20} className={pathname.includes('/projects/documents') ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Documentos</span>}
                    </Link>
                    <Link id="tour-sidebar-deliveries" href="/dashboard/projects/deliveries" className={`${navItemBase} ${pathname.includes('/projects/deliveries') ? navItemActive : navItemInactive}`}>
                        <Package size={20} className={pathname.includes('/projects/deliveries') ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Entregas</span>}
                    </Link>
                    <Link id="tour-sidebar-proposals" href="/dashboard/proposals" className={`${navItemBase} ${pathname.includes('/proposals') ? navItemActive : navItemInactive}`}>
                        <ScrollText size={20} className={pathname.includes('/proposals') ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Proposta</span>}
                    </Link>
                </div>

                {/* Sistemas */}
                <div className="space-y-1">
                    {!collapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Sistemas</div>}
                    <Link id="tour-sidebar-notifications" href="/dashboard/notifications" className={`${navItemBase} ${pathname.includes('/notifications') ? navItemActive : navItemInactive}`}>
                        <Bell size={20} className={pathname.includes('/notifications') ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Notificações</span>}
                    </Link>
                    <Link id="tour-sidebar-settings" href="/dashboard/settings" className={`${navItemBase} ${pathname.includes('/settings') ? navItemActive : navItemInactive}`}>
                        <Settings size={20} className={pathname.includes('/settings') ? 'text-blue-500' : 'text-slate-400'} />
                        {!collapsed && <span>Configurações</span>}
                    </Link>
                </div>
            </div>

            {/* Bottom Actions */}
            <div id="tour-sidebar-profile" className="p-4 border-t border-slate-800 space-y-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-white/[0.06]">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shrink-0 font-bold text-sm overflow-hidden">
                            {user?.avatar ? (
                                <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}${user.avatar}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || "U"
                            )}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 overflow-hidden">
                                <h4 className="text-sm font-bold text-white truncate">{user?.name || "Usuário"}</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{user?.email || ""}</p>
                            </div>
                        )}
                    </Link>
                    {!collapsed && (
                        <button onClick={async () => { await logout(); router.push("/login"); }} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
