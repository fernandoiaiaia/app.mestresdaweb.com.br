"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    ChevronLeft, Settings, Building, 
    FileText, MapPin, UserPlus, ShieldCheck
} from "lucide-react";

export default function CompanySettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { id: "general", href: "/dashboard/management/settings/company", label: "Dados Principais", icon: FileText, exact: true },
        { id: "branches", href: "/dashboard/management/settings/company/branches", label: "Múltiplas Filiais", icon: MapPin },
        { id: "partners", href: "/dashboard/management/settings/company/partners", label: "Quadro de Sócios", icon: UserPlus },
        { id: "certificate", href: "/dashboard/management/settings/company/certificate", label: "Certificado Digital", icon: ShieldCheck }
    ];

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/management/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Dados da Empresa</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <Building size={24} className="text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Matriz e Fiscal</h1>
                        <p className="text-sm text-slate-400">Gerencie informações fiscais, sócios e certificado digital</p>
                    </div>
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 border-b border-white/[0.06] pb-4">
                {tabs.map((tab) => {
                    const isActive = tab.exact 
                        ? pathname === tab.href 
                        : pathname.startsWith(tab.href);
                    
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                isActive 
                                ? "bg-slate-800 border border-white/[0.08] text-white" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                            }`}
                        >
                            <tab.icon size={16} className={isActive ? "text-blue-400" : "text-slate-500"} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {/* Content */}
            <div className="relative">
                {children}
            </div>
        </div>
    );
}
