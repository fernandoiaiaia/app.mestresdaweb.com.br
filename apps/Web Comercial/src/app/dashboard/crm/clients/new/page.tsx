"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Users,
    Save,
    CheckCircle2,
    User,
    Mail,
    Phone,
    Building2,
    Globe,
    MapPin,
    Tag,
    MessageSquare,
    Star,
    AlertCircle,
    Briefcase,
    Hash,
    Linkedin,
    Instagram,
    Plus,
    Trash2,
    Search,
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
    "Consultor",
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
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-blue-500/10 ${value === role ? 'bg-blue-500/10 text-blue-400 font-bold' : 'text-slate-300'
                                        }`}
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

// Field components OUTSIDE the main component to avoid re-creation on every render
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

export default function NewClientPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const [form, setForm] = useState({
        nome: "", email: "", celular: "",
        empresa: "", cnpj: "", cargo: "", segmento: "", site: "",
        endereco: "", cidade: "", estado: "", cep: "",
        origem: "", linkedin: "", instagram: "", observacoes: "",
        tags: [] as string[],
    });

    const [contacts, setContacts] = useState<{ id: string; name: string; email: string; phone: string; role: string; isPrimary: boolean }[]>([]);

    const [tagInput, setTagInput] = useState("");

    const maskCPFCNPJ = (value: string) => {
        let v = value.replace(/\D/g, "");
        if (v.length <= 11) {
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else {
            v = v.replace(/^(\d{2})(\d)/, "$1.$2");
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
            v = v.slice(0, 18);
        }
        return v;
    };

    const maskPhone = (value: string) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v.slice(0, 15);
    };

    const maskCEP = (value: string) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        return v.slice(0, 9);
    };

    const fetchAddress = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setForm(prev => ({
                        ...prev,
                        endereco: data.logradouro ? `${data.logradouro}${data.bairro ? ` - ${data.bairro}` : ''}` : prev.endereco,
                        cidade: data.localidade || prev.cidade,
                        estado: data.uf || prev.estado,
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    const update = (key: string, value: string) => {
        let finalValue = value;
        if (key === "celular") finalValue = maskPhone(value);
        if (key === "cnpj") finalValue = maskCPFCNPJ(value);
        if (key === "cep") {
            finalValue = maskCEP(value);
            if (finalValue.length === 9) fetchAddress(finalValue);
        }

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

    const addContact = () => {
        setContacts(prev => [...prev, { id: Math.random().toString(), name: "", email: "", phone: "", role: "", isPrimary: false }]);
    };

    const removeContact = (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
    };

    const updateContact = (id: string, field: string, value: string) => {
        setContacts(prev => prev.map(c => {
            if (c.id === id) {
                let finalValue = value;
                if (field === "phone") finalValue = maskPhone(value);
                return { ...c, [field]: finalValue };
            }
            return c;
        }));
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

        // Build notes field incorporating tags and social metadata
        let compiledNotes = form.observacoes;
        const extras = [];
        if (form.linkedin) extras.push(`LinkedIn: ${form.linkedin}`);
        if (form.instagram) extras.push(`Instagram: ${form.instagram}`);
        if (form.tags.length > 0) extras.push(`Tags: ${form.tags.join(', ')}`);

        if (extras.length > 0) {
            compiledNotes = compiledNotes ? `${compiledNotes}\n\n---\n${extras.join('\n')}` : extras.join('\n');
        }

        const payload = {
            name: form.nome,
            company: form.empresa || undefined,
            email: form.email || undefined,
            phone: form.celular || undefined,
            role: form.cargo || undefined,
            city: form.cidade || undefined,
            state: form.estado || undefined,
            website: form.site || undefined,
            segment: form.segmento || undefined,
            source: form.origem || undefined,
            notes: compiledNotes || undefined,
            contacts: contacts.filter(c => c.name.trim() !== "").map(c => ({
                name: c.name,
                email: c.email || undefined,
                phone: c.phone || undefined,
                role: c.role || undefined,
                isPrimary: c.isPrimary
            }))
        };

        try {
            const res = await api("/api/clients", {
                method: "POST",
                body: payload
            });
            if (res.success) {
                setSaved(true);
                setTimeout(() => { router.push("/dashboard/crm/clients"); }, 1500);
            } else {
                toast.error("Erro ao salvar", res.message || "Tente novamente mais tarde.");
            }
        } catch (error) {
            console.error("Erro ao salvar cliente", error);
            toast.error("Erro fatal ao salvar cliente.");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/crm/clients" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Users size={14} /><span>Clientes</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Novo Cliente</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <User size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Cadastro de Cliente</h1>
                            <p className="text-sm text-slate-400">Preencha os dados do novo cliente ou lead</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saved} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${saved ? 'bg-blue-700 text-blue-200 shadow-blue-700/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}>
                        {saved ? <><CheckCircle2 size={16} /> Salvo!</> : <><Save size={16} /> Cadastrar Cliente</>}
                    </button>
                </div>
            </motion.div>

            <div className="space-y-6">
                {/* Company Data */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Building2 size={14} className="text-blue-400" /> Dados da Empresa</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Informações corporativas (opcionais)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nome Completo" field="nome" value={form.nome} error={errors.nome} required placeholder="Ex: João Silva Santos" icon={User} span={2} onChange={update} />
                        <InputField label="E-mail" field="email" value={form.email} error={errors.email} required type="email" placeholder="joao@empresa.com.br" icon={Mail} onChange={update} />
                        <InputField label="Celular / WhatsApp" field="celular" value={form.celular} error={errors.celular} required type="tel" placeholder="(11) 99999-0000" icon={Phone} onChange={update} />
                        <RoleCombobox value={form.cargo} onChange={(v) => update("cargo", v)} />
                        <InputField label="Nome da Empresa" field="empresa" value={form.empresa} placeholder="Empresa Ltda" icon={Building2} onChange={update} />
                        <InputField label="CPF / CNPJ" field="cnpj" value={form.cnpj} placeholder="00.000.000/0001-00" icon={Hash} onChange={update} />
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Segmento</label>
                            <div className="relative">
                                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select value={form.segmento} onChange={(e) => update("segmento", e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
                                    <option value="">Selecionar...</option>
                                    <option value="tecnologia">Tecnologia</option>
                                    <option value="saude">Saúde</option>
                                    <option value="educacao">Educação</option>
                                    <option value="financeiro">Financeiro</option>
                                    <option value="varejo">Varejo</option>
                                    <option value="industria">Indústria</option>
                                    <option value="servicos">Serviços</option>
                                    <option value="governo">Governo</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>
                        <InputField label="Website" field="site" value={form.site} placeholder="https://empresa.com.br" icon={Globe} onChange={update} />
                    </div>
                </motion.div>

                {/* Additional Contacts */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Users size={14} className="text-cyan-400" /> Contatos Adicionais da Empresa</h3>
                            <p className="text-[10px] text-slate-500">Mapeie decisores e influenciadores (opcional)</p>
                        </div>
                        <button onClick={addContact} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors border border-white/[0.08]">
                            <Plus size={12} /> Adicionar Contato
                        </button>
                    </div>

                    {contacts.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-xl flex items-center justify-center flex-col gap-2">
                            <Users size={24} className="text-slate-600 mb-1" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nenhum contato secundário</span>
                            <span className="text-[10px] text-slate-600">Adicione diretores, compradores ou analistas atrelados à conta.</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contacts.map((contact, index) => (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} key={contact.id} className="p-4 bg-slate-900/50 border border-white/[0.04] rounded-xl relative group">
                                    <button onClick={() => removeContact(contact.id)} className="absolute top-3 right-3 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Nome do Contato" field="name" value={contact.name} placeholder="Aline Ferreira" icon={User} onChange={(_f, v) => updateContact(contact.id, "name", v)} />
                                        <RoleCombobox value={contact.role} onChange={(v) => updateContact(contact.id, "role", v)} />
                                        <InputField label="E-mail" field="email" value={contact.email} type="email" placeholder="aline@empresa.com.br" icon={Mail} onChange={(_f, v) => updateContact(contact.id, "email", v)} />
                                        <InputField label="Celular / WhatsApp" field="phone" value={contact.phone} type="tel" placeholder="(11) 90000-0000" icon={Phone} onChange={(_f, v) => updateContact(contact.id, "phone", v)} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Address */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> Endereço</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Localização (opcional)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="CEP" field="cep" value={form.cep} placeholder="01000-000" icon={Hash} onChange={update} />
                            <InputField label="Estado" field="estado" value={form.estado} placeholder="SP" icon={MapPin} onChange={update} />
                        </div>
                        <InputField label="Cidade" field="cidade" value={form.cidade} placeholder="São Paulo" icon={MapPin} onChange={update} />
                        <InputField label="Endereço Completo" field="endereco" value={form.endereco} placeholder="Rua, número, complemento, bairro" icon={MapPin} span={2} onChange={update} />
                    </div>
                </motion.div>

                {/* Social & Extra */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Globe size={14} className="text-purple-400" /> Redes Sociais & Extra</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Informações complementares (opcionais)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="LinkedIn" field="linkedin" value={form.linkedin} placeholder="linkedin.com/in/joaosilva" icon={Linkedin} onChange={update} />
                        <InputField label="Instagram" field="instagram" value={form.instagram} placeholder="@joaosilva" icon={Instagram} onChange={update} />
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><MessageSquare size={14} className="text-amber-400" /> Observações</h3>
                    <p className="text-[10px] text-slate-500 mb-3">Notas internas sobre o cliente (opcional)</p>
                    <textarea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} rows={4} placeholder="Informações relevantes, contexto da reunião, necessidades identificadas..." className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.04]">
                <Link href="/dashboard/crm/clients" className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                    Cancelar
                </Link>
                <button onClick={handleSave} disabled={saved} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${saved ? 'bg-blue-700 text-blue-200' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}>
                    {saved ? <><CheckCircle2 size={16} /> Cliente Cadastrado!</> : <><Save size={16} /> Cadastrar Cliente</>}
                </button>
            </div>
        </div>
    );
}
