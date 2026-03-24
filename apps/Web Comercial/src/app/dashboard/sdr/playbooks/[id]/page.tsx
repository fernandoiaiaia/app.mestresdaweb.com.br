"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BookOpen,
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    MessageSquare,
    Shield,
    Trophy,
    DollarSign,
    BrainCircuit,
    AlertCircle,
    Lightbulb,
} from "lucide-react";

export default function PlaybookEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { getPlaybook, updatePlaybook } = useSDRStore();
    const playbook = getPlaybook(id);

    const [form, setForm] = useState({
        name: "", valueProposition: "", description: "", pains: [] as string[], differentials: [] as string[],
        objections: [] as { objection: string; response: string }[], cases: [] as { client: string; result: string; quote: string }[],
        priceRange: "", aiInstructions: "", status: "inactive" as "active" | "inactive",
    });

    const [newPain, setNewPain] = useState("");
    const [newDiff, setNewDiff] = useState("");

    useEffect(() => {
        if (playbook) {
            setForm({
                name: playbook.name, valueProposition: playbook.valueProposition, description: playbook.description,
                pains: [...playbook.pains], differentials: [...playbook.differentials],
                objections: playbook.objections.map(o => ({ ...o })), cases: playbook.cases.map(c => ({ ...c })),
                priceRange: playbook.priceRange, aiInstructions: playbook.aiInstructions, status: playbook.status,
            });
        }
    }, [playbook]);

    if (!playbook) {
        return <div className="p-10 text-center text-slate-400">Playbook não encontrado. <button onClick={() => router.back()} className="text-blue-400 hover:text-blue-300 ml-2">Voltar</button></div>;
    }

    const handleSave = () => {
        updatePlaybook(id, form);
        router.push("/dashboard/sdr/playbooks");
    };

    const fieldClass = "bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600";
    const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
    const sectionClass = "bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4";

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors">Hub SDR</Link>
                <span>/</span>
                <Link href="/dashboard/sdr/playbooks" className="hover:text-white transition-colors">Playbooks</Link>
                <span>/</span>
                <span className="text-white font-medium truncate max-w-[150px]">{form.name}</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-purple-500" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Editor de Playbook</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${form.status === "active" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                        {form.status === "active" ? "● Ativo" : "○ Inativo"}
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <Save size={16} /> Salvar
                    </button>
                </div>
            </motion.div>

            {/* Basic Info */}
            <div className={sectionClass}>
                <div>
                    <label className={labelClass}>Nome do Produto / Serviço</label>
                    <input type="text" className={fieldClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Plataforma SaaS de Gestão" />
                </div>
                <div>
                    <label className={labelClass}>
                        <Lightbulb size={12} className="inline mr-1 text-amber-400" />
                        Proposta de Valor (1 frase)
                    </label>
                    <input type="text" className={fieldClass} value={form.valueProposition} onChange={e => setForm(f => ({ ...f, valueProposition: e.target.value }))} placeholder="Ex: Reduza 40% do tempo operacional com automação inteligente" />
                </div>
                <div>
                    <label className={labelClass}>Descrição do Produto</label>
                    <textarea className={`${fieldClass} min-h-[100px] resize-none`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="2-3 parágrafos: o que faz, para quem é, como funciona" />
                </div>
            </div>

            {/* Pains */}
            <div className={sectionClass}>
                <label className={labelClass}><AlertCircle size={12} className="inline mr-1 text-red-400" /> Dores que Resolve</label>
                <div className="flex flex-wrap gap-2">
                    {form.pains.map((p, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-medium">
                            {p}
                            <button onClick={() => setForm(f => ({ ...f, pains: f.pains.filter((_, j) => j !== i) }))} className="hover:text-white"><Trash2 size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input type="text" className={`${fieldClass} flex-1`} value={newPain} onChange={e => setNewPain(e.target.value)} placeholder="Adicionar dor..." onKeyDown={e => { if (e.key === "Enter" && newPain.trim()) { setForm(f => ({ ...f, pains: [...f.pains, newPain.trim()] })); setNewPain(""); } }} />
                    <button onClick={() => { if (newPain.trim()) { setForm(f => ({ ...f, pains: [...f.pains, newPain.trim()] })); setNewPain(""); } }} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Differentials */}
            <div className={sectionClass}>
                <label className={labelClass}><Shield size={12} className="inline mr-1 text-blue-400" /> Diferenciais Competitivos</label>
                <div className="flex flex-wrap gap-2">
                    {form.differentials.map((d, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                            {d}
                            <button onClick={() => setForm(f => ({ ...f, differentials: f.differentials.filter((_, j) => j !== i) }))} className="hover:text-white"><Trash2 size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input type="text" className={`${fieldClass} flex-1`} value={newDiff} onChange={e => setNewDiff(e.target.value)} placeholder="Adicionar diferencial..." onKeyDown={e => { if (e.key === "Enter" && newDiff.trim()) { setForm(f => ({ ...f, differentials: [...f.differentials, newDiff.trim()] })); setNewDiff(""); } }} />
                    <button onClick={() => { if (newDiff.trim()) { setForm(f => ({ ...f, differentials: [...f.differentials, newDiff.trim()] })); setNewDiff(""); } }} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Objections */}
            <div className={sectionClass}>
                <label className={labelClass}><MessageSquare size={12} className="inline mr-1 text-amber-400" /> Objeções Comuns + Respostas</label>
                {form.objections.map((obj, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                        <input className={fieldClass} placeholder="Objeção..." value={obj.objection} onChange={e => { const nObj = [...form.objections]; nObj[i] = { ...nObj[i], objection: e.target.value }; setForm(f => ({ ...f, objections: nObj })); }} />
                        <div className="flex gap-2">
                            <input className={`${fieldClass} flex-1`} placeholder="Resposta da IA..." value={obj.response} onChange={e => { const nObj = [...form.objections]; nObj[i] = { ...nObj[i], response: e.target.value }; setForm(f => ({ ...f, objections: nObj })); }} />
                            <button onClick={() => setForm(f => ({ ...f, objections: f.objections.filter((_, j) => j !== i) }))} className="p-2 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, objections: [...f.objections, { objection: "", response: "" }] }))} className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all w-full justify-center">
                    <Plus size={14} /> Adicionar Objeção
                </button>
            </div>

            {/* Cases */}
            <div className={sectionClass}>
                <label className={labelClass}><Trophy size={12} className="inline mr-1 text-amber-400" /> Cases de Sucesso</label>
                {form.cases.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex gap-2">
                            <input className={`${fieldClass} flex-1`} placeholder="Nome do cliente..." value={c.client} onChange={e => { const nCases = [...form.cases]; nCases[i] = { ...nCases[i], client: e.target.value }; setForm(f => ({ ...f, cases: nCases })); }} />
                            <button onClick={() => setForm(f => ({ ...f, cases: f.cases.filter((_, j) => j !== i) }))} className="p-2 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                        </div>
                        <input className={fieldClass} placeholder="Resultado alcançado..." value={c.result} onChange={e => { const nCases = [...form.cases]; nCases[i] = { ...nCases[i], result: e.target.value }; setForm(f => ({ ...f, cases: nCases })); }} />
                        <input className={fieldClass} placeholder="Depoimento curto..." value={c.quote} onChange={e => { const nCases = [...form.cases]; nCases[i] = { ...nCases[i], quote: e.target.value }; setForm(f => ({ ...f, cases: nCases })); }} />
                    </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, cases: [...f.cases, { client: "", result: "", quote: "" }] }))} className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all w-full justify-center">
                    <Plus size={14} /> Adicionar Case
                </button>
            </div>

            {/* Price & AI */}
            <div className={sectionClass}>
                <div>
                    <label className={labelClass}><DollarSign size={12} className="inline mr-1 text-blue-400" /> Faixa de Preço (opcional)</label>
                    <input type="text" className={fieldClass} value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))} placeholder="Ex: R$ 497 a R$ 2.997/mês" />
                </div>
                <div>
                    <label className={labelClass}><BrainCircuit size={12} className="inline mr-1 text-purple-400" /> Instruções para a IA</label>
                    <textarea className={`${fieldClass} min-h-[80px] resize-none`} value={form.aiInstructions} onChange={e => setForm(f => ({ ...f, aiInstructions: e.target.value }))} placeholder='Ex: "Nunca mencione concorrente X", "Sempre sugira demonstração"' />
                </div>
            </div>
        </div>
    );
}
