"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import {
    Home,
    Users,
    Kanban,
    Target,
    Settings,
    CheckSquare,
    BarChart3,
    Bell,
    Package,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    Workflow,
    MessageCircle,
} from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useAuthStore } from "@/stores/auth";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [crmExpanded, setCrmExpanded] = useState(true);
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    // Check actual permissions
    const permissions = user?.permissions || [];
    const hasModuleAccess = (moduleName: string) => {
        // If OWNER/ADMIN, allow by default
        if (user?.role === "OWNER" || user?.role === "ADMIN") return true;
        // If they have any permission with this module prefix, they can see the menu
        return permissions.some((p: { module: string }) => p.module.startsWith(moduleName));
    };

    // Section-level checks
    const hasCrmAccess = hasModuleAccess("crm.");
    const hasManagerAccess = hasModuleAccess("manager.");
    const hasSettingsAccess = hasModuleAccess("settings");


    const navItemBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium";
    const navItemActive = "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20";
    const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/50";

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-[80px]' : 'w-[280px]'
                }`}
        >
            {/* Brand Name */}
            <div className={`flex shrink-0 items-center justify-center border-b border-slate-800 ${collapsed ? 'py-4' : 'py-5'}`}>
                {!collapsed && (
                    <Image src="/branding/logo-mdw.png" alt="Mestres da Web" width={180} height={40} className="w-full max-w-[180px] h-auto object-contain" />
                )}
                {collapsed && (
                    <Image src="/branding/logo-mdw.png" alt="MDW" width={50} height={40} className="w-[90%] max-w-[50px] h-auto object-contain" />
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

                {/* Main Nav — Dashboard */}
                {hasModuleAccess("dashboard") && (
                    <div className="space-y-1">
                        {!collapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Principal</div>}
                        <Link href="/dashboard" className={`${navItemBase} ${pathname === '/dashboard' ? navItemActive : navItemInactive}`}>
                            <Home size={20} className={pathname === '/dashboard' ? 'text-blue-500' : 'text-slate-400'} />
                            {!collapsed && <span>Dashboard</span>}
                        </Link>
                    </div>
                )}

                {/* CRM Section */}
                {hasCrmAccess && (
                    <div className="space-y-1">
                        {!collapsed && (
                            <div
                                className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                                onClick={() => setCrmExpanded(!crmExpanded)}
                            >
                                <span className="text-[10px] font-bold tracking-widest uppercase">CRM</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${crmExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        )}

                        {(crmExpanded || collapsed) && (
                            <div className="space-y-1">
                                {hasModuleAccess("crm.clients") && (
                                    <Link href="/dashboard/crm/clients" className={`${navItemBase} ${pathname.includes('/crm/clients') ? navItemActive : navItemInactive}`}>
                                        <Users size={20} className={pathname.includes('/crm/clients') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Clientes</span>}
                                    </Link>
                                )}

                                {hasModuleAccess("crm.pipeline") && (
                                    <Link href="/dashboard/crm/pipeline" className={`${navItemBase} ${pathname.includes('/crm/pipeline') ? navItemActive : navItemInactive}`}>
                                        <Kanban size={20} className={pathname.includes('/crm/pipeline') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Pipeline</span>}
                                    </Link>
                                )}
                                {hasModuleAccess("crm.cadence") && (
                                    <Link href="/dashboard/crm/sales-cadence" className={`${navItemBase} ${pathname.includes('/crm/sales-cadence') ? navItemActive : navItemInactive}`}>
                                        <Workflow size={20} className={pathname.includes('/crm/sales-cadence') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Fluxo de Cadência</span>}
                                    </Link>
                                )}
                                {hasModuleAccess("crm.opportunities") && (
                                    <Link href="/dashboard/crm/opportunities" className={`${navItemBase} ${pathname.includes('/crm/opportunities') ? navItemActive : navItemInactive}`}>
                                        <Target size={20} className={pathname.includes('/crm/opportunities') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Oportunidades</span>}
                                    </Link>
                                )}

                                {hasModuleAccess("crm.tasks") && (
                                    <Link href="/dashboard/crm/tasks" className={`${navItemBase} ${pathname.includes('/crm/tasks') ? navItemActive : navItemInactive}`}>
                                        <CheckSquare size={20} className={pathname.includes('/crm/tasks') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Tarefas</span>}
                                    </Link>
                                )}

                                {hasModuleAccess("crm.proposals") && (
                                    <Link href="/dashboard/crm/assembler" className={`${navItemBase} ${pathname.includes('/crm/assembler') ? navItemActive : navItemInactive}`}>
                                        <Package size={20} className={pathname.includes('/crm/assembler') ? 'text-blue-500' : 'text-slate-400'} />
                                        {!collapsed && <span>Montador de Proposta</span>}
                                    </Link>
                                )}

                                {hasModuleAccess("crm") && (
                                    <Link href="/dashboard/whatsapp/kanban" className={`${navItemBase} ${pathname.includes('/whatsapp') ? 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20' : navItemInactive}`}>
                                        <MessageCircle size={20} className={pathname.includes('/whatsapp') ? 'text-emerald-400' : 'text-slate-400'} />
                                        {!collapsed && <span>WhatsApp Web</span>}
                                    </Link>
                                )}

                            </div>
                        )}
                    </div>
                )}

                {(hasManagerAccess || hasSettingsAccess) && (
                    <div className="space-y-1">
                        {!collapsed && <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Gestão</div>}
                        {hasModuleAccess("manager.queue") && (
                            <Link href="/dashboard/manager/queue" className={`${navItemBase} ${pathname.includes('/manager/queue') ? navItemActive : navItemInactive}`}>
                                <CheckSquare size={20} className={pathname.includes('/manager/queue') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Fila de Aprovação</span>}
                            </Link>
                        )}
                        {hasModuleAccess("manager.reports") && (
                            <Link href="/dashboard/manager/reports" className={`${navItemBase} ${pathname.includes('/manager/reports') ? navItemActive : navItemInactive}`}>
                                <BarChart3 size={20} className={pathname.includes('/manager/reports') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Relatórios</span>}
                            </Link>
                        )}
                        {hasModuleAccess("manager.activity") && (
                            <Link href="/dashboard/activity" className={`${navItemBase} ${pathname.includes('/activity') ? navItemActive : navItemInactive}`}>
                                <Clock size={20} className={pathname.includes('/activity') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Log de Atividades</span>}
                            </Link>
                        )}
                        {hasSettingsAccess && (
                            <Link href="/dashboard/settings" className={`${navItemBase} ${pathname.includes('/settings') ? navItemActive : navItemInactive}`}>
                                <Settings size={20} className={pathname.includes('/settings') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Configurações</span>}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                {collapsed ? (
                    <Link href="/dashboard/notifications" className="relative flex items-center justify-center w-full p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1/2 translate-x-3 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900">3</span>
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
                                /* eslint-disable-next-line @next/next/no-img-element */
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
                        <button onClick={() => { logout(); window.location.href = "/login"; }} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
