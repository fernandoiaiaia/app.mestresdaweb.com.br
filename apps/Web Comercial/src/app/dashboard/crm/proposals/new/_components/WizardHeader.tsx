"use client";

import { motion } from "framer-motion";
import { Sparkles, FileText, LayoutTemplate, Zap, Calculator, Users } from "lucide-react";

export function WizardHeader({
    title,
    subtitle,
    currentStep,
    totalSteps,
}: {
    title: string;
    subtitle: string;
    currentStep: 1 | 2 | 3 | 4 | 5;
    totalSteps?: number;
}) {
    const steps = [
        { id: 1, label: "Informações", icon: <FileText size={14} /> },
        { id: 2, label: "Revisão", icon: <LayoutTemplate size={14} /> },
        { id: 3, label: "IA", icon: <Zap size={14} /> },
        { id: 4, label: "Estimativa", icon: <Calculator size={14} /> },
        { id: 5, label: "Equipe", icon: <Users size={14} /> },
    ];

    return (
        <div className="mb-10">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-[1px] shadow-[0_0_20px_rgba(59,130,246,0.3)] shrink-0">
                    <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                        <Sparkles size={24} className="text-blue-500" />
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
                    <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-widest">{subtitle}</p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex overflow-x-auto p-1 bg-white/5 rounded-2xl border border-white/10 w-full sm:w-fit"
            >
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isPast = currentStep > step.id;
                    
                    return (
                        <div
                            key={step.id}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap 
                                ${isActive ? "bg-slate-800 border border-slate-700 text-white shadow-lg relative" : 
                                    isPast ? "text-slate-300" : "text-slate-500"}`}
                        >
                            <span className={isActive ? "text-blue-500" : isPast ? "text-slate-400" : "text-slate-600"}>
                                {step.icon}
                            </span>
                            <span>{step.label}</span>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}
