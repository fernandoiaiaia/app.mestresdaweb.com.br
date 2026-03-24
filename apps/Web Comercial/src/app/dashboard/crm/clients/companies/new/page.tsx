"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ChevronLeft,
    Building2,
    Save,
    CheckCircle2,
    Hash,
    Globe,
    MapPin,
    Tag,
    MessageSquare,
    AlertCircle,
    Search,
    User,
    Users,
    X,
    Mail,
    Phone,
    Briefcase,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

/* ═══ Reusable InputField ═══ */
function InputField({ label, field, value, error, required, placeholder = "", icon: Icon, span = 1, onChange }: {
    label: string; field: string; value: string; error?: boolean; required?: boolean; placeholder?: string; icon: any; span?: number;
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
                    type="text"
                    value={value}
                    onChange={(e) => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-blue-500/40'}`}
                />
            </div>
            {error && <span className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Campo obrigatório</span>}
        </div>
    );
}

/* ═══ Contact type ═══ */
interface AvailableContact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    companyId: string | null;
}

export default function NewCompanyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [saved, setSaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const [form, setForm] = useState({
        name: "", cnpj: "", segment: "", website: "",
        cep: "", city: "", state: "", rua: "", numero: "", bairro: "", complemento: "", notes: "",
    });

    // Contact linking state
    const [availableContacts, setAvailableContacts] = useState<AvailableContact[]>([]);
    const [linkedContacts, setLinkedContacts] = useState<AvailableContact[]>([]);
    const [contactSearch, setContactSearch] = useState("");
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const contactRef = useRef<HTMLDivElement>(null);

    // Load available (unlinked) contacts
    useEffect(() => {
        api<AvailableContact[]>("/api/clients").then(res => {
            if (res?.success && res.data) {
                setAvailableContacts(res.data.filter((c: any) => !c.companyId));
            }
        });
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (contactRef.current && !contactRef.current.contains(e.target as Node)) setShowContactDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredContacts = availableContacts
        .filter(c => !linkedContacts.find(l => l.id === c.id))
        .filter(c => {
            const q = contactSearch.toLowerCase();
            return c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.role || "").toLowerCase().includes(q);
        });

    const linkContact = (contact: AvailableContact) => {
        setLinkedContacts(prev => [...prev, contact]);
        setContactSearch("");
        setShowContactDropdown(false);
    };

    const unlinkContact = (id: string) => {
        setLinkedContacts(prev => prev.filter(c => c.id !== id));
    };

    /* ═══ Masks ═══ */
    const maskCNPJ = (value: string) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");
        return v.slice(0, 18);
    };

    const maskCEP = (value: string) => {
        let v = value.replace(/\D/g, "");
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        return v.slice(0, 9);
    };

    const fetchAddress = async (cep: string) => {
        const clean = cep.replace(/\D/g, "");
        if (clean.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setForm(prev => ({
                        ...prev,
                        rua: data.logradouro || prev.rua,
                        bairro: data.bairro || prev.bairro,
                        city: data.localidade || prev.city,
                        state: data.uf || prev.state,
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    const update = (key: string, value: string) => {
        let finalValue = value;
        if (key === "cnpj") finalValue = maskCNPJ(value);
        if (key === "cep") {
            finalValue = maskCEP(value);
            if (finalValue.replace(/\D/g, "").length === 8) fetchAddress(finalValue);
        }
        setForm(prev => ({ ...prev, [key]: finalValue }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
    };

    const handleSave = async () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.name.trim()) newErrors.name = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload: Record<string, any> = {};
        const skipKeys = ["cep", "rua", "numero", "bairro", "complemento"];
        Object.entries(form).forEach(([k, v]) => {
            if (skipKeys.includes(k)) return;
            if (v.trim()) payload[k] = v;
        });

        // Compose address from parts
        const addressParts = [form.rua, form.numero, form.bairro, form.complemento].filter(p => p.trim());
        if (addressParts.length > 0) payload.address = addressParts.join(", ");

        // Include linked contact IDs
        if (linkedContacts.length > 0) {
            payload.clientIds = linkedContacts.map(c => c.id);
        }

        try {
            const res = await api("/api/companies", {
                method: "POST",
                body: payload,
            });
            if (res.success) {
                setSaved(true);
                setTimeout(() => { router.push("/dashboard/crm/clients/companies"); }, 1500);
            } else {
                toast.error("Erro ao cadastrar", res.message || "Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar empresa.");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/crm/clients/companies" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Building2 size={14} /><span>Empresas</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Nova Empresa</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Nova Empresa</h1>
                            <p className="text-sm text-slate-400">Preencha os dados da empresa</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-6">
                {/* Company Data */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Building2 size={14} className="text-blue-400" /> Dados da Empresa</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Informações corporativas</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nome da Empresa" field="name" value={form.name} error={errors.name} required placeholder="Empresa Ltda" icon={Building2} span={2} onChange={update} />
                        <InputField label="CNPJ" field="cnpj" value={form.cnpj} placeholder="00.000.000/0001-00" icon={Hash} onChange={update} />
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Segmento</label>
                            <div className="relative">
                                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <select value={form.segment} onChange={e => update("segment", e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer">
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
                        <InputField label="Website" field="website" value={form.website} placeholder="https://empresa.com.br" icon={Globe} onChange={update} />
                    </div>
                </motion.div>

                {/* ═══ Link Contacts ═══ */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Users size={14} className="text-cyan-400" /> Vincular Contatos</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Busque e selecione contatos para atrelar a esta empresa (somente contatos sem empresa)</p>

                    {/* Search combobox */}
                    <div ref={contactRef} className="relative mb-4">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={contactSearch}
                            onChange={e => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                            onFocus={() => setShowContactDropdown(true)}
                            placeholder="Buscar contato por nome, e-mail ou cargo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                        />
                        {showContactDropdown && (
                            <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-xl">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.slice(0, 20).map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => linkContact(c)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-500/10 transition-colors flex items-center gap-3 border-b border-white/[0.03] last:border-0"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm text-white font-medium block truncate">{c.name}</span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-2">
                                                    {c.role && <span>{c.role}</span>}
                                                    {c.email && <span>· {c.email}</span>}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-4 text-xs text-slate-500 text-center">
                                        {contactSearch ? "Nenhum contato disponível encontrado" : "Todos os contatos já estão vinculados"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Linked contacts list */}
                    {linkedContacts.length > 0 ? (
                        <div className="space-y-2">
                            {linkedContacts.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-white/[0.04] rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-white">{c.name}</span>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                {c.role && <span className="flex items-center gap-1"><Briefcase size={9} /> {c.role}</span>}
                                                {c.email && <span className="flex items-center gap-1"><Mail size={9} /> {c.email}</span>}
                                                {c.phone && <span className="flex items-center gap-1 hidden md:flex"><Phone size={9} /> {c.phone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => unlinkContact(c.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5 border border-dashed border-white/[0.08] rounded-xl flex items-center justify-center flex-col gap-1">
                            <User size={20} className="text-slate-600" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nenhum contato vinculado</span>
                            <span className="text-[10px] text-slate-600">Use a busca acima para atrelar contatos a esta empresa</span>
                        </div>
                    )}
                </motion.div>

                {/* Address */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> Endereço</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Digite o CEP para preencher automaticamente</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="CEP" field="cep" value={form.cep} placeholder="01000-000" icon={Hash} onChange={update} />
                        <InputField label="Rua" field="rua" value={form.rua} placeholder="Rua das Flores" icon={MapPin} onChange={update} />
                        <InputField label="Número" field="numero" value={form.numero} placeholder="1234" icon={Hash} onChange={update} />
                        <InputField label="Bairro" field="bairro" value={form.bairro} placeholder="Centro" icon={MapPin} onChange={update} />
                        <InputField label="Complemento" field="complemento" value={form.complemento} placeholder="Sala 101, Bloco A" icon={MapPin} onChange={update} />
                        <InputField label="Cidade" field="city" value={form.city} placeholder="São Paulo" icon={MapPin} onChange={update} />
                        <InputField label="Estado" field="state" value={form.state} placeholder="SP" icon={MapPin} onChange={update} />
                    </div>
                </motion.div>

                {/* Notes */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><MessageSquare size={14} className="text-amber-400" /> Observações</h3>
                    <p className="text-[10px] text-slate-500 mb-3">Notas internas (opcional)</p>
                    <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={4} placeholder="Informações relevantes sobre a empresa..." className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.04]">
                <Link href="/dashboard/crm/clients/companies" className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
                    Cancelar
                </Link>
                <button onClick={handleSave} disabled={saved} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${saved ? 'bg-blue-700 text-blue-200' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}`}>
                    {saved ? <><CheckCircle2 size={16} /> Empresa Cadastrada!</> : <><Save size={16} /> Cadastrar Empresa</>}
                </button>
            </div>
        </div>
    );
}
