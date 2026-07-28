"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import {
    Users,
    FileText,
    CreditCard,
    Calendar,
    Receipt,
    Target,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    DollarSign,
    PieChart,
    Home,
    PiggyBank,
    AlertCircle
} from "lucide-react";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [homeExpanded, setHomeExpanded] = useState(true);
    const [contractsExpanded, setContractsExpanded] = useState(true);
    const [financialExpanded, setFinancialExpanded] = useState(true);
    const [managementExpanded, setManagementExpanded] = useState(true);
    
    const pathname = usePathname();

    const navItemBase = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium";
    const navItemActive = "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20";
    const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/50";

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 shadow-xl transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-[80px]' : 'w-[280px]'}`}
        >
            <div className={`flex shrink-0 items-center justify-center border-b border-slate-800 relative ${collapsed ? 'py-4' : 'py-5'}`}>
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

            <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar flex flex-col gap-6">
                
                {/* Início Section */}
                <div className="space-y-1">
                    {!collapsed && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setHomeExpanded(!homeExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Início</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${homeExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(homeExpanded || collapsed) && (
                        <div className="space-y-1">
                            <Link href="/dashboard" className={`${navItemBase} ${pathname === '/dashboard' ? navItemActive : navItemInactive}`}>
                                <Home size={20} className={pathname === '/dashboard' ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Dashboard</span>}
                            </Link>
                            <Link href="/dashboard/clients" className={`${navItemBase} ${pathname.includes('/dashboard/clients') ? navItemActive : navItemInactive}`}>
                                <Users size={20} className={pathname.includes('/dashboard/clients') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Clientes</span>}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Contratos Section */}
                <div className="space-y-1">
                    {!collapsed && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setContractsExpanded(!contractsExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Contratos</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${contractsExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(contractsExpanded || collapsed) && (
                        <div className="space-y-1">
                            <Link href="/dashboard/contracts" className={`${navItemBase} ${pathname.includes('/dashboard/contracts') ? navItemActive : navItemInactive}`}>
                                <FileText size={20} className={pathname.includes('/dashboard/contracts') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Contratos</span>}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Financeiro Section */}
                <div className="space-y-1">
                    {!collapsed && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setFinancialExpanded(!financialExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Financeiro</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${financialExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(financialExpanded || collapsed) && (
                        <div className="space-y-1">
                            <Link href="/dashboard/financial/transactions" className={`${navItemBase} ${pathname.includes('/dashboard/financial/transactions') ? navItemActive : navItemInactive}`}>
                                <DollarSign size={20} className={pathname.includes('/dashboard/financial/transactions') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Transações</span>}
                            </Link>
                            <Link href="/dashboard/financial/pendencies" className={`${navItemBase} ${pathname.includes('/dashboard/financial/pendencies') ? navItemActive : navItemInactive}`}>
                                <AlertCircle size={20} className={pathname.includes('/dashboard/financial/pendencies') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Pendências</span>}
                            </Link>
                            <Link href="/dashboard/financial/cards" className={`${navItemBase} ${pathname.includes('/dashboard/financial/cards') ? navItemActive : navItemInactive}`}>
                                <CreditCard size={20} className={pathname.includes('/dashboard/financial/cards') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Cartões</span>}
                            </Link>
                            <Link href="/dashboard/financial/invoices" className={`${navItemBase} ${pathname.includes('/dashboard/financial/invoices') ? navItemActive : navItemInactive}`}>
                                <Receipt size={20} className={pathname.includes('/dashboard/financial/invoices') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Nota fiscal</span>}
                            </Link>
                            <Link href="/dashboard/financial/calendar" className={`${navItemBase} ${pathname.includes('/dashboard/financial/calendar') ? navItemActive : navItemInactive}`}>
                                <Calendar size={20} className={pathname.includes('/dashboard/financial/calendar') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Calendário</span>}
                            </Link>
                            <Link href="/dashboard/financial/profit-distribution" className={`${navItemBase} ${pathname.includes('/dashboard/financial/profit-distribution') ? navItemActive : navItemInactive}`}>
                                <PieChart size={20} className={pathname.includes('/dashboard/financial/profit-distribution') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Distribuição de Lucros</span>}
                            </Link>
                            <Link href="/dashboard/financial/investments" className={`${navItemBase} ${pathname.includes('/dashboard/financial/investments') ? navItemActive : navItemInactive}`}>
                                <PiggyBank size={20} className={pathname.includes('/dashboard/financial/investments') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Investimentos / Reserva</span>}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Gestão Section */}
                <div className="space-y-1">
                    {!collapsed && (
                        <div
                            className="px-3 mb-2 flex items-center justify-between cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                            onClick={() => setManagementExpanded(!managementExpanded)}
                        >
                            <span className="text-[10px] font-bold tracking-widest uppercase">Gestão</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${managementExpanded ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                    {(managementExpanded || collapsed) && (
                        <div className="space-y-1">
                            <Link href="/dashboard/management/reports" className={`${navItemBase} ${pathname.includes('/dashboard/management/reports') ? navItemActive : navItemInactive}`}>
                                <BarChart3 size={20} className={pathname.includes('/dashboard/management/reports') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Relatórios</span>}
                            </Link>
                            <Link href="/dashboard/management/settings" className={`${navItemBase} ${pathname.includes('/dashboard/management/settings') ? navItemActive : navItemInactive}`}>
                                <Settings size={20} className={pathname.includes('/dashboard/management/settings') ? 'text-blue-500' : 'text-slate-400'} />
                                {!collapsed && <span>Configurações</span>}
                            </Link>
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-white/[0.06]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shrink-0 font-bold text-sm overflow-hidden">
                            A
                        </div>
                        {!collapsed && (
                            <div className="flex-1 overflow-hidden">
                                <h4 className="text-sm font-bold text-white truncate">Admin</h4>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">admin@mestresdaweb.com.br</p>
                            </div>
                        )}
                    </div>
                    {!collapsed && (
                        <button onClick={() => window.location.href = "/"} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sair">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
