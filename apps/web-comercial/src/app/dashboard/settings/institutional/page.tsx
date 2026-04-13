"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Building2, Upload, Palette, Save,
    CheckCircle2, Globe, Mail, Phone, MapPin, FileText, Hash, Loader2,
} from "lucide-react";

interface InstitutionalProfile {
    id: string;
    companyName: string | null;
    tradeName: string | null;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    tagline: string | null;
    about: string | null;
    logoUrl: string | null;
    buttonColor: string;
}

const presetColors = [
    { name: "Verde", value: "#16a34a" }, { name: "Azul", value: "#2563eb" }, { name: "Roxo", value: "#7c3aed" },
    { name: "Ciano", value: "#0891b2" }, { name: "Rosa", value: "#db2777" }, { name: "Laranja", value: "#ea580c" },
    { name: "Vermelho", value: "#dc2626" }, { name: "Âmbar", value: "#d97706" }, { name: "Indigo", value: "#4f46e5" }, { name: "Teal", value: "#0d9488" },
];

export default function InstitutionalPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Company Data
    const [companyName, setCompanyName] = useState("");
    const [tradeName, setTradeName] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [website, setWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [tagline, setTagline] = useState("");
    const [about, setAbout] = useState("");

    // Visual Identity
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [buttonColor, setButtonColor] = useState("#16a34a");

    // ═══ Load ═══
    useEffect(() => {
        (async () => {
            try {
                const res = await api<InstitutionalProfile>("/api/institutional", { method: "GET" });
                if (res.success && res.data) {
                    const d = res.data;
                    setCompanyName(d.companyName || "");
                    setTradeName(d.tradeName || "");
                    setCnpj(d.cnpj || "");
                    setEmail(d.email || "");
                    setPhone(d.phone || "");
                    setWebsite(d.website || "");
                    setAddress(d.address || "");
                    setTagline(d.tagline || "");
                    setAbout(d.about || "");
                    setLogoPreview(d.logoUrl || null);
                    setButtonColor(d.buttonColor || "#16a34a");
                }
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, []);

    // ═══ Save ═══
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api<InstitutionalProfile>("/api/institutional", {
                method: "PUT",
                body: {
                    companyName: companyName || null,
                    tradeName: tradeName || null,
                    cnpj: cnpj || null,
                    email: email || null,
                    phone: phone || null,
                    website: website || null,
                    address: address || null,
                    tagline: tagline || null,
                    about: about || null,
                    logoUrl: logoPreview || null,
                    buttonColor,
                },
            });
            if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { setLogoPreview(ev.target?.result as string); };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => { setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Institucional</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Building2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Configuração Institucional</h1>
                            <p className="text-sm text-slate-400">Dados da empresa e identidade visual</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-60 ${saved ? 'bg-blue-500 shadow-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white`}>
                        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} /> Salvo!</> : <><Save size={16} /> Salvar</>}
                    </button>
                </div>
            </motion.div>

            <div className="space-y-6">

                {/* ═══ IDENTIDADE VISUAL ═══ */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-5 flex items-center gap-2">
                        <Palette size={16} className="text-blue-500" /> Identidade Visual
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Logo da Empresa</label>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 rounded-xl bg-slate-800 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Image src="/images/emblemaverde.png" alt="Logo" width={64} height={64} className="object-contain" unoptimized />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors">
                                        <Upload size={14} /> {logoPreview ? "Trocar" : "Upload"}
                                    </button>
                                    {logoPreview && (
                                        <button onClick={removeLogo} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Remover logo</button>
                                    )}
                                    <span className="text-[9px] text-slate-600">PNG, JPG ou SVG. Máx 2MB.</span>
                                </div>
                            </div>
                        </div>

                        {/* Button Color */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Cor dos Botões</label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <input type="color" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                                    <input type="text" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} className="w-28 px-3 py-2 bg-slate-800/50 border border-white/[0.08] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-blue-500/40" />
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1.5">Cores sugeridas</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {presetColors.map(c => (
                                            <button key={c.value} onClick={() => setButtonColor(c.value)} className={`w-7 h-7 rounded-lg transition-all ${buttonColor === c.value ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white/30 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`} style={{ backgroundColor: c.value }} title={c.name} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-600 block mb-1.5">Pré-visualização</span>
                                    <div className="flex items-center gap-3">
                                        <button className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90" style={{ backgroundColor: buttonColor }}>Botão Primário</button>
                                        <button className="px-5 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80" style={{ borderColor: buttonColor, color: buttonColor }}>Botão Secundário</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ DADOS DA EMPRESA ═══ */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-5 flex items-center gap-2">
                        <Building2 size={16} className="text-blue-400" /> Dados da Empresa
                    </h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><Building2 size={10} /> Nome Fantasia</span>
                                </label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><FileText size={10} /> Razão Social</span>
                                </label>
                                <input type="text" value={tradeName} onChange={(e) => setTradeName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><Hash size={10} /> CNPJ</span>
                                </label>
                                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><Globe size={10} /> Website</span>
                                </label>
                                <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><Mail size={10} /> E-mail</span>
                                </label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                    <span className="flex items-center gap-1"><Phone size={10} /> Telefone</span>
                                </label>
                                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                                <span className="flex items-center gap-1"><MapPin size={10} /> Endereço Completo</span>
                            </label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Tagline / Slogan</label>
                            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Sobre a Empresa</label>
                            <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 resize-none leading-relaxed" />
                            <span className="text-[9px] text-slate-600 mt-1 block text-right">{about.length} caracteres</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
