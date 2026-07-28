"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Users,
    Building2,
    User,
    ArrowRight,
    TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ClientsLandingPage() {
    const [contactCount, setContactCount] = useState(0);
    const [companyCount, setCompanyCount] = useState(0);

    useEffect(() => {
        api<any[]>("/api/clients").then(res => {
            if (res?.success && res.data) setContactCount(res.data.length);
        });
        api<any[]>("/api/companies").then(res => {
            if (res?.success && res.data) setCompanyCount(res.data.length);
        });
    }, []);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Users size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Clientes</h1>
                        <p className="text-sm text-slate-400">Gerencie seus contatos e empresas</p>
                    </div>
                </div>
            </motion.div>

            {/* Two Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contato Card */}
                <Link href="/dashboard/crm/clients/contacts">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative overflow-hidden bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 cursor-pointer group transition-all hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                        {/* Gradient accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <User size={28} className="text-white" />
                            </div>
                            <ArrowRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Contatos</h2>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            Gerencie pessoas de contato, vincule a empresas, registre cargos e informações pessoais.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg">
                                <TrendingUp size={14} className="text-blue-400" />
                                <span className="text-sm font-bold text-blue-400">{contactCount}</span>
                                <span className="text-xs text-slate-500">cadastrados</span>
                            </div>
                        </div>
                    </motion.div>
                </Link>

                {/* Empresa Card */}
                <Link href="/dashboard/crm/clients/companies">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        className="relative overflow-hidden bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 cursor-pointer group transition-all hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                        {/* Gradient accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Building2 size={28} className="text-white" />
                            </div>
                            <ArrowRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Empresas</h2>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            Cadastre empresas, visualize contatos vinculados e gerencie dados corporativos.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg">
                                <Building2 size={14} className="text-blue-400" />
                                <span className="text-sm font-bold text-blue-400">{companyCount}</span>
                                <span className="text-xs text-slate-500">cadastradas</span>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </div>
        </div>
    );
}
