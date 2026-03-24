"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Bug, User, FolderKanban, Printer } from "lucide-react";
import PrintReport from "./PrintReport";

const TABS = [
    { href: "/dashboard/reports/team", label: "Desempenho da Equipe", icon: Users, color: "text-blue-400", count: 10 },
    { href: "/dashboard/reports/quality", label: "Qualidade e Bugs", icon: Bug, color: "text-red-400", count: 8 },
    { href: "/dashboard/reports/individual", label: "Desempenho Individual", icon: User, color: "text-blue-400", count: 12 },
    { href: "/dashboard/reports/project", label: "Desempenho por Projeto", icon: FolderKanban, color: "text-purple-400", count: 10 },
];

const PRINT_CSS = `
@media print {
    @page { size: A4 portrait; margin: 10mm 8mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    aside, nav, header, .no-print { display: none !important; }
    html, body { background: #fff !important; }
    main, [class*="ml-"] { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; max-width: 100% !important; }
    .screen-only { display: none !important; }
    .print-only {
        position: static !important;
        left: auto !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
}
@media screen {
    .print-only {
        position: absolute;
        left: -9999px;
        width: 800px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }
}
`;

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Extract active tab from pathname: "/dashboard/reports/team" → "team"
    const activeTab = pathname.split("/").pop() || "team";

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

            <div className="screen-only p-6 md:p-8 space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h1>
                        <p className="text-slate-400 mt-1">40 indicadores para gestão completa de equipe, qualidade, indivíduos e projetos.</p>
                    </div>
                    <button onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                        <Printer size={16} /> Imprimir Relatório
                    </button>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 no-print">
                    {TABS.map(t => {
                        const active = pathname === t.href;
                        return (
                            <Link key={t.href} href={t.href}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${active
                                    ? "bg-blue-600/15 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/5"
                                    : "bg-slate-800/40 text-slate-400 border-white/[0.06] hover:border-slate-600"
                                    }`}>
                                <t.icon size={16} className={active ? t.color : "text-slate-500"} />
                                {t.label}
                                <span className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 rounded-full">{t.count}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Page Content */}
                {children}
            </div>

            {/* Print layout — off-screen on display, visible on print */}
            <div className="print-only">
                <PrintReport activeTab={activeTab} />
            </div>
        </>
    );
}

