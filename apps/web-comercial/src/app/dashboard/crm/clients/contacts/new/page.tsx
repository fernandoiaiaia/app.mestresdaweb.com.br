"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Save,
    CheckCircle2,
    User,
    Mail,
    Phone,
    Building2,
    Globe,
    Tag,
    MessageSquare,
    AlertCircle,
    Briefcase,
    Linkedin,
    Instagram,
    Search,
    X,
    Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const ROLE_SUGGESTIONS = [
    "Diretor de Marketing",
    "Diretor Financeiro",
    "Diretor Comercial",
    "Diretor de TI",
    "Diretor de Operações",
    "Diretor Executivo (CEO)",
    "Gerente Comercial",
    "Gerente de Projetos",
    "Gerente Financeiro",
    "Gerente de Marketing",
    "Gerente de TI",
    "Gerente de Compras",
    "Gerente de RH",
    "Comprador",
    "Analista Comercial",
    "Analista de Marketing",
    "Analista Financeiro",
    "Coordenador de Projetos",
    "Coordenador Comercial",
    "Advisor",
    "Sócio / Proprietário",
    "Assistente Administrativo",
    "Estagiário",
];

function RoleCombobox({ value, onChange, placeholder = "Buscar ou selecionar cargo..." }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = ROLE_SUGGESTIONS.filter(r =>
        r.toLowerCase().includes(value.toLowerCase())
    );

    return (
        <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cargo / Função</label>
            <div className="relative" ref={ref}>
                <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                />
                {open && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-xl">
                        {filtered.length > 0 ? (
                            filtered.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => { onChange(role); setOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-blue-500/10 ${value === role ? 'bg-blue-500/10 text-blue-400 font-bold' : 'text-slate-300'}`}
                                >
                                    {role}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-500 text-center">Nenhum cargo encontrado — use o texto digitado</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InputField({ label, field, value, error, required, type = "text", placeholder = "", icon: Icon, span = 1, onChange }: {
    label: string; field: string; value: string; error?: boolean; required?: boolean; type?: string; placeholder?: string; icon: any; span?: number;
    onChange: (field: string, value: string) => void;
}) {
    return (
        <div className={span === 2 ? "md:col-span-2" : ""}>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 flex items-center gap-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-blue-500/40'}`}
                />
            </div>
            {error && (
                <span className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Campo obrigatório</span>
            )}
        </div>
    );
}

interface CompanyOption {
    id: string;
    name: string;
    cnpj: string | null;
    segment: string | null;
}

export default function NewContactPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const [form, setForm] = useState({
        nome: "", cargo: "", email: "", celular: "", segmento: "",
        instagram: "", linkedin: "", origem: "", observacoes: "",
        portalPassword: "",
        tags: [] as string[],
    });

    // Company linking
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
    const [companySearch, setCompanySearch] = useState("");
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const companyRef = useRef<HTMLDivElement>(null);

    const [tagInput, setTagInput] = useState("");
    const [segments, setSegments] = useState<{ id: string; name: string; active: boolean }[]>([]);

    useEffect(() => {
        api<CompanyOption[]>("/api/companies").then(res => {
            if (res?.success && res.data) setCompanies(res.data);
        });
        api<{ id: string; name: string; active: boolean }[]>("/api/segments").then(res => {
            if (res?.success && res.data) setSegments(res.data.filter(s => s.active));
        });
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (companyRef.current && !companyRef.current.contains(e.target as Node)) setShowCompanyDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredCompanies = companies.filter(c => {
        const q = companySearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.cnpj || "").includes(q);
    });

    const maskPhone = (value: string) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v.slice(0, 15);
    };

    const update = (key: string, value: string) => {
        let finalValue = value;
        if (key === "celular") finalValue = maskPhone(value);
        setForm(prev => ({ ...prev, [key]: finalValue }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
    };

    const addTag = () => {
        if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
            setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSave = async () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.nome.trim()) newErrors.nome = true;
        if (!form.email.trim() || !form.email.includes("@")) newErrors.email = true;
        if (!form.celular.trim()) newErrors.celular = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        let compiledNotes = form.observacoes;
        const extras = [];
        if (form.linkedin) extras.push(`LinkedIn: ${form.linkedin}`);
        if (form.instagram) extras.push(`Instagram: ${form.instagram}`);
        if (form.tags.length > 0) extras.push(`Tags: ${form.tags.join(', ')}`);

        if (extras.length > 0) {
            compiledNotes = compiledNotes ? `${compiledNotes}\n\n---\n${extras.join('\n')}` : extras.join('\n');
        }

        const payload: Record<string, any> = {
            name: form.nome,
            email: form.email || undefined,
            phone: form.celular || undefined,
            role: form.cargo || undefined,
            segment: form.segmento || undefined,
            source: form.origem || undefined,
            notes: compiledNotes || undefined,
            portalPassword: form.portalPassword || undefined,
        };

        if (selectedCompany) {
            payload.companyId = selectedCompany.id;
            payload.company = selectedCompany.name;
        }

        try {
            const res = await api("/api/clients", {
                method: "POST",
                body: payload,
            });
            if (res.success) {
                setSaved(true);
                setTimeout(() => { router.push("/dashboard/crm/clients/contacts"); }, 1500);
            } else {
                toast.error("Erro ao salvar", res.error?.message || res.message || "Tente novamente mais tarde.");
            }
        } catch (error) {
            console.error("Erro ao salvar contato", error);
            toast.error("Erro fatal ao salvar contato.");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/crm/clients/contacts" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><User size={14} /><span>Contatos</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Novo Contato</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <User size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Novo Contato</h1>
                            <p className="text-sm text-slate-400">Preencha os dados do novo contato</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-6">
                {/* Contact Data */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><User size={14} className="text-blue-400" /> Dados do Contato</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Informações pessoais</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nome Completo" field="nome" value={form.nome} error={errors.nome} required placeholder="Ex: João Silva Santos" icon={User} span={2} onChange={update} />
                        <RoleCombobox value={form.cargo} onChange={(v) => update("cargo", v)} />
                        <InputField label="E-mail" field="email" value={form.email} error={errors.email} required type="email" placeholder="joao@empresa.com.br" icon={Mail} onChange={update} />
                        <InputField label="Celular / WhatsApp" field="celular" value={form.celular} error={errors.celular} required type="tel" placeholder="(11) 99999-0000" icon={Phone} onChange={update} />
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Segmento</label>
                            <div className="relative">
                                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select value={form.segmento} onChange={(e) => update("segmento", e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
                                    <option value="">Selecionar...</option>
                                    {segments.map(seg => (
                                        <option key={seg.id} value={seg.name}>{seg.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Portal Access */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Lock size={14} className="text-blue-400" />
                                Credenciais do Portal do Cliente
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-1">Crie uma senha para liberar o acesso ao acompanhamento de Propostas.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5 flex items-center gap-1">E-mail de Login</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={form.email}
                                    readOnly
                                    placeholder="Preencha o e-mail logo acima"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/[0.04] rounded-xl text-sm text-slate-400 cursor-not-allowed focus:outline-none"
                                />
                            </div>
                        </div>
                        <InputField label="Senha de Acesso (Opcional)" field="portalPassword" type="text" value={form.portalPassword} placeholder="Defina uma senha..." icon={Lock} onChange={update} />
                    </div>
                </motion.div>

                {/* Link Company */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Building2 size={14} className="text-blue-400" /> Empresa</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Vincule este contato a uma empresa cadastrada (opcional)</p>

                    {selectedCompany ? (
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-blue-500/20 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                    {selectedCompany.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-white">{selectedCompany.name}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        {selectedCompany.cnpj && <span>{selectedCompany.cnpj}</span>}
                                        {selectedCompany.segment && <span>· {selectedCompany.segment}</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCompany(null)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div ref={companyRef} className="relative">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input
                                type="text"
                                value={companySearch}
                                onChange={e => { setCompanySearch(e.target.value); setShowCompanyDropdown(true); }}
                                onFocus={() => setShowCompanyDropdown(true)}
                                placeholder="Buscar empresa por nome ou CNPJ..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                            />
                            {showCompanyDropdown && (
                                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-xl">
                                    {filteredCompanies.length > 0 ? (
                                        filteredCompanies.slice(0, 15).map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setSelectedCompany(c); setCompanySearch(""); setShowCompanyDropdown(false); }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-blue-500/10 transition-colors flex items-center gap-3 border-b border-white/[0.03] last:border-0"
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                    {c.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-sm text-white font-medium block truncate">{c.name}</span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {c.cnpj && <span>{c.cnpj}</span>}
                                                        {c.segment && <span> · {c.segment}</span>}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-4 text-xs text-slate-500 text-center">
                                            {companySearch ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Social & Origin */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Globe size={14} className="text-purple-400" /> Redes Sociais & Origem</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Informações complementares (opcionais)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Instagram" field="instagram" value={form.instagram} placeholder="@joaosilva" icon={Instagram} onChange={update} />
                        <InputField label="LinkedIn" field="linkedin" value={form.linkedin} placeholder="linkedin.com/in/joaosilva" icon={Linkedin} onChange={update} />
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Origem / Como chegou</label>
                            <div className="relative">
                                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select value={form.origem} onChange={(e) => update("origem", e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
                                    <option value="">Selecionar...</option>
                                    <option value="indicacao">Indicação</option>
                                    <option value="google">Google</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="evento">Evento</option>
                                    <option value="outbound">Outbound / Prospecção</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tags */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Tag size={14} className="text-cyan-400" /> Tags</h3>
                    <p className="text-[10px] text-slate-500 mb-3">Adicione marcações para organizar (opcional)</p>
                    <div className="flex items-center gap-2 mb-3">
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Digite uma tag e pressione Enter" className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                        <button onClick={addTag} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">Adicionar</button>
                    </div>
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {form.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[11px] font-medium">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-red-400 transition-colors">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Notes */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><MessageSquare size={14} className="text-amber-400" /> Observações</h3>
                    <p className="text-[10px] text-slate-500 mb-3">Notas internas sobre o contato (opcional)</p>
                    <textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} rows={4} placeholder="Informações relevantes, contexto da reunião, necessidades identificadas..." className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.04]">
                <Link href="/dashboard/crm/clients/contacts" className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                    Cancelar
                </Link>
                <button onClick={handleSave} disabled={saved} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${saved ? 'bg-blue-700 text-blue-200' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}>
                    {saved ? <><CheckCircle2 size={16} /> Contato Cadastrado!</> : <><Save size={16} /> Cadastrar Contato</>}
                </button>
            </div>
        </div>
    );
}
