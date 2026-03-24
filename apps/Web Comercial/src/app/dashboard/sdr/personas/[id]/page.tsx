"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    UserCircle,
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Briefcase,
    MessageSquare,
    BrainCircuit,
    Target,
    Heart,
} from "lucide-react";

export default function PersonaEditorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { getPersona, updatePersona } = useSDRStore();
    const persona = getPersona(id);

    const [form, setForm] = useState({
        name: "", targetRoles: [] as string[], seniority: "Gerência", segments: [] as string[], companySize: "pme",
        pains: [] as string[], buyMotivations: [] as string[], language: "formal", objections: [] as string[], aiInstructions: "", status: "inactive" as "active" | "inactive",
    });

    const [newRole, setNewRole] = useState("");
    const [newSegment, setNewSegment] = useState("");
    const [newPain, setNewPain] = useState("");
    const [newMotivation, setNewMotivation] = useState("");
    const [newObjection, setNewObjection] = useState("");

    useEffect(() => {
        if (persona) {
            setForm({
                name: persona.name, targetRoles: [...persona.targetRoles], seniority: persona.seniority,
                segments: [...persona.segments], companySize: persona.companySize, pains: [...persona.pains],
                buyMotivations: [...persona.buyMotivations], language: persona.language, objections: [...persona.objections], aiInstructions: persona.aiInstructions, status: persona.status,
            });
        }
    }, [persona]);

    if (!persona) return <div className="p-10 text-center text-slate-400">Persona não encontrada. <button onClick={() => router.back()} className="text-blue-400 hover:text-blue-300 ml-2">Voltar</button></div>;

    const handleSave = () => { updatePersona(id, form); router.push("/dashboard/sdr/personas"); };

    const fieldClass = "bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-600";
    const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
    const sectionClass = "bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4";

    const TagList = ({ items, color, onRemove }: { items: string[]; color: string; onRemove: (i: number) => void }) => (
        <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
                <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 rounded-full text-xs font-medium`}>
                    {item}
                    <button onClick={() => onRemove(i)} className="hover:text-white"><Trash2 size={12} /></button>
                </span>
            ))}
        </div>
    );

    const addTag = (val: string, setter: (v: string) => void, key: keyof typeof form) => {
        if (val.trim()) {
            setForm(f => ({ ...f, [key]: [...(f[key] as string[]), val.trim()] }));
            setter("");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors">Hub SDR</Link>
                <span>/</span>
                <Link href="/dashboard/sdr/personas" className="hover:text-white transition-colors">Personas</Link>
                <span>/</span>
                <span className="text-white font-medium truncate max-w-[150px]">{form.name}</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><UserCircle size={20} className="text-orange-500" /></div>
                    <h1 className="text-xl font-bold text-white">Editor de Persona</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${form.status === "active" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                        {form.status === "active" ? "● Ativa" : "○ Inativa"}
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"><Save size={16} /> Salvar</button>
                </div>
            </motion.div>

            {/* Nome + Senioridade */}
            <div className={sectionClass}>
                <div>
                    <label className={labelClass}>Nome da Persona</label>
                    <input type="text" className={fieldClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder='Ex: "CEO de Startup", "Gerente de TI Corporação"' />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Nível de Senioridade</label>
                        <select className={fieldClass} value={form.seniority} onChange={e => setForm(f => ({ ...f, seniority: e.target.value }))}>
                            <option value="C-Level">C-Level</option>
                            <option value="Direção">Direção</option>
                            <option value="Gerência">Gerência</option>
                            <option value="Operacional">Operacional</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Tamanho de Empresa</label>
                        <select className={fieldClass} value={form.companySize} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))}>
                            <option value="startup">Startup (até 20)</option>
                            <option value="pme">PME (20-100)</option>
                            <option value="media">Média (100-500)</option>
                            <option value="enterprise">Enterprise (500+)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Linguagem Preferida</label>
                    <select className={fieldClass} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                        <option value="formal">Formal</option>
                        <option value="técnica">Técnica</option>
                        <option value="casual">Casual</option>
                        <option value="direta">Direta</option>
                    </select>
                </div>
            </div>

            {/* Cargos-alvo */}
            <div className={sectionClass}>
                <label className={labelClass}><Briefcase size={12} className="inline mr-1 text-orange-400" /> Cargos-alvo</label>
                <TagList items={form.targetRoles} color="orange" onRemove={i => setForm(f => ({ ...f, targetRoles: f.targetRoles.filter((_, j) => j !== i) }))} />
                <div className="flex gap-2">
                    <input className={`${fieldClass} flex-1`} value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Ex: CEO, CTO, Diretor..." onKeyDown={e => { if (e.key === "Enter") addTag(newRole, setNewRole, "targetRoles"); }} />
                    <button onClick={() => addTag(newRole, setNewRole, "targetRoles")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Segmentos */}
            <div className={sectionClass}>
                <label className={labelClass}><Target size={12} className="inline mr-1 text-cyan-400" /> Segmentos de Empresa</label>
                <TagList items={form.segments} color="cyan" onRemove={i => setForm(f => ({ ...f, segments: f.segments.filter((_, j) => j !== i) }))} />
                <div className="flex gap-2">
                    <input className={`${fieldClass} flex-1`} value={newSegment} onChange={e => setNewSegment(e.target.value)} placeholder="Ex: Tecnologia, Saúde, Varejo..." onKeyDown={e => { if (e.key === "Enter") addTag(newSegment, setNewSegment, "segments"); }} />
                    <button onClick={() => addTag(newSegment, setNewSegment, "segments")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Dores */}
            <div className={sectionClass}>
                <label className={labelClass}><MessageSquare size={12} className="inline mr-1 text-red-400" /> Dores Típicas</label>
                <TagList items={form.pains} color="red" onRemove={i => setForm(f => ({ ...f, pains: f.pains.filter((_, j) => j !== i) }))} />
                <div className="flex gap-2">
                    <input className={`${fieldClass} flex-1`} value={newPain} onChange={e => setNewPain(e.target.value)} placeholder="Adicionar dor..." onKeyDown={e => { if (e.key === "Enter") addTag(newPain, setNewPain, "pains"); }} />
                    <button onClick={() => addTag(newPain, setNewPain, "pains")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Motivações */}
            <div className={sectionClass}>
                <label className={labelClass}><Heart size={12} className="inline mr-1 text-pink-400" /> Motivações de Compra</label>
                <TagList items={form.buyMotivations} color="pink" onRemove={i => setForm(f => ({ ...f, buyMotivations: f.buyMotivations.filter((_, j) => j !== i) }))} />
                <div className="flex gap-2">
                    <input className={`${fieldClass} flex-1`} value={newMotivation} onChange={e => setNewMotivation(e.target.value)} placeholder="Ex: ROI, eficiência, inovação..." onKeyDown={e => { if (e.key === "Enter") addTag(newMotivation, setNewMotivation, "buyMotivations"); }} />
                    <button onClick={() => addTag(newMotivation, setNewMotivation, "buyMotivations")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            {/* Objeções + IA */}
            <div className={sectionClass}>
                <label className={labelClass}>Objeções Comuns</label>
                <TagList items={form.objections} color="amber" onRemove={i => setForm(f => ({ ...f, objections: f.objections.filter((_, j) => j !== i) }))} />
                <div className="flex gap-2">
                    <input className={`${fieldClass} flex-1`} value={newObjection} onChange={e => setNewObjection(e.target.value)} placeholder="Adicionar objeção..." onKeyDown={e => { if (e.key === "Enter") addTag(newObjection, setNewObjection, "objections"); }} />
                    <button onClick={() => addTag(newObjection, setNewObjection, "objections")} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"><Plus size={16} /></button>
                </div>
            </div>

            <div className={sectionClass}>
                <label className={labelClass}><BrainCircuit size={12} className="inline mr-1 text-purple-400" /> Instruções para a IA</label>
                <textarea className={`${fieldClass} min-h-[80px] resize-none`} value={form.aiInstructions} onChange={e => setForm(f => ({ ...f, aiInstructions: e.target.value }))} placeholder='Ex: "Seja direto, CEOs não têm tempo", "Use dados e números"' />
            </div>
        </div>
    );
}
