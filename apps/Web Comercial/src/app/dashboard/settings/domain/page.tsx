"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft,
    Settings,
    Globe,
    Save,
    CheckCircle2,
    ExternalLink,
    Lock,
    Palette,
    Eye,
    Copy,
    X,
    RefreshCw,
    Shield,
    Upload,
    Trash2,
    Image,
    Loader2,
} from "lucide-react";

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-blue-600" : "bg-slate-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`} />
    </button>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

export default function DomainPage() {
    const [isLoading, setIsLoading] = useState(true);

    // Subdomain
    const [portalSubdomain, setPortalSubdomain] = useState("");
    const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
    const [subdomainMsg, setSubdomainMsg] = useState("");
    const [checkingSub, setCheckingSub] = useState(false);

    // Custom domain
    const [customDomain, setCustomDomain] = useState("");
    const [domainVerified, setDomainVerified] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [sslActive, setSslActive] = useState(false);
    const [sslProvisioning, setSslProvisioning] = useState(false);
    const [verificationToken, setVerificationToken] = useState("pai_verify_...");
    const [verifyMsg, setVerifyMsg] = useState("");

    // White Label
    const [whitelabelEnabled, setWhitelabelEnabled] = useState(false);
    const [whitelabelName, setWhitelabelName] = useState("");
    const [whitelabelPrimaryColor, setWhitelabelPrimaryColor] = useState("#10b981");
    const [whitelabelLogo, setWhitelabelLogo] = useState<string | null>(null);
    const [whitelabelFavicon, setWhitelabelFavicon] = useState<string | null>(null);
    const [whitelabelFooter, setWhitelabelFooter] = useState("");
    const [whitelabelHidePoweredBy, setWhitelabelHidePoweredBy] = useState(false);

    // Preview / Remove
    const [showPreview, setShowPreview] = useState(false);
    const [showRemoveDomain, setShowRemoveDomain] = useState(false);

    // Save
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // File refs
    const logoRef = useRef<HTMLInputElement>(null);
    const faviconRef = useRef<HTMLInputElement>(null);

    const cnameTarget = "proxy.proposalai.app";
    const portalUrl = `https://${portalSubdomain || "portal"}.proposalai.app`;
    const customUrl = customDomain ? `https://${customDomain}` : null;

    // ═══ Load data ═══
    const loadData = useCallback(async () => {
        const res = await api<any>("/api/domain/settings");
        if (res.success && res.data) {
            const s = res.data;
            setPortalSubdomain(s.portalSubdomain || "");
            setCustomDomain(s.customDomain || "");
            setDomainVerified(s.domainVerified || false);
            setSslActive(s.sslActive || false);
            setVerificationToken(s.verificationToken || "pai_verify_...");
            setWhitelabelEnabled(s.whitelabelEnabled || false);
            setWhitelabelName(s.whitelabelName || "");
            setWhitelabelPrimaryColor(s.whitelabelPrimaryColor || "#10b981");
            setWhitelabelLogo(s.whitelabelLogo || null);
            setWhitelabelFavicon(s.whitelabelFavicon || null);
            setWhitelabelFooter(s.whitelabelFooter || "");
            setWhitelabelHidePoweredBy(s.whitelabelHidePoweredBy || false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        loadData().finally(() => setIsLoading(false));
    }, [loadData]);

    // ═══ Save ═══
    const handleSave = async () => {
        setSaving(true);
        const res = await api<any>("/api/domain/settings", {
            method: "PUT",
            body: JSON.stringify({
                portalSubdomain, customDomain,
                whitelabelEnabled, whitelabelName, whitelabelPrimaryColor,
                whitelabelFooter, whitelabelHidePoweredBy,
            }),
        });
        setSaving(false);
        if (res.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            if (res.data?.verificationToken) setVerificationToken(res.data.verificationToken);
        }
    };

    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    // ═══ Check subdomain ═══
    const checkSubdomain = async () => {
        setCheckingSub(true);
        setSubdomainAvailable(null);
        const res = await api<any>("/api/domain/check-subdomain", {
            method: "POST",
            body: JSON.stringify({ subdomain: portalSubdomain }),
        });
        setCheckingSub(false);
        if (res.success && res.data) {
            setSubdomainAvailable(res.data.available);
            setSubdomainMsg(res.data.message);
        }
    };

    // ═══ Verify Domain DNS ═══
    const verifyDomain = async () => {
        if (!customDomain.trim()) return;
        setVerifying(true);
        setVerifyMsg("");
        setSslProvisioning(true);
        const res = await api<any>("/api/domain/verify-domain", { method: "POST" });
        setVerifying(false);
        if (res.success && res.data) {
            setDomainVerified(res.data.verified);
            setSslActive(res.data.sslActive);
            setVerifyMsg(res.data.message);
            setSslProvisioning(false);
        }
    };

    // ═══ Remove domain ═══
    const removeDomain = async () => {
        await api("/api/domain/remove-domain", { method: "DELETE" });
        setCustomDomain("");
        setDomainVerified(false);
        setSslActive(false);
        setShowRemoveDomain(false);
    };

    // ═══ File uploads ═══
    const handleFileUpload = async (type: "logo" | "favicon", file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = document.cookie.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]
            || localStorage.getItem("accessToken") || "";

        const res = await fetch(`${API_URL}/api/domain/upload/${type}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });
        const data = await res.json();
        if (data.success) {
            if (type === "logo") setWhitelabelLogo(data.data.filePath);
            else setWhitelabelFavicon(data.data.filePath);
        }
    };

    const removeFile = async (type: "logo" | "favicon") => {
        await api(`/api/domain/file/${type}`, { method: "DELETE" });
        if (type === "logo") setWhitelabelLogo(null);
        else setWhitelabelFavicon(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Hidden file inputs */}
            <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload("logo", e.target.files[0]); }} />
            <input ref={faviconRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload("favicon", e.target.files[0]); }} />

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Domínio & White Label</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Globe size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Domínio & White Label</h1>
                            <p className="text-sm text-slate-400">Configure domínio personalizado e marca própria</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60">
                        {saved ? <><CheckCircle2 size={16} /> Salvo!</> : saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar</>}
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Subdomínio", value: portalSubdomain ? `${portalSubdomain}.proposalai.app` : "Não definido", icon: Globe, color: "text-blue-400" },
                    { label: "Domínio Custom", value: customDomain || "Não configurado", icon: Lock, color: domainVerified ? "text-blue-400" : "text-slate-400" },
                    { label: "SSL", value: sslActive ? "Ativo" : sslProvisioning ? "Provisionando" : "—", icon: Shield, color: sslActive ? "text-blue-400" : sslProvisioning ? "text-amber-400" : "text-slate-400" },
                    { label: "White Label", value: whitelabelEnabled ? "Ativo" : "Inativo", icon: Palette, color: whitelabelEnabled ? "text-purple-400" : "text-slate-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={14} className={`${s.color} mb-2`} />
                        <span className="text-xs font-bold text-white block truncate">{s.value}</span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-6">
                {/* Portal Subdomain */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-400" /> Subdomínio do Portal</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 shrink-0">https://</span>
                        <input type="text" value={portalSubdomain} onChange={(e) => { setPortalSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setSubdomainAvailable(null); }} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white font-medium focus:outline-none focus:border-blue-500/40 w-48" />
                        <span className="text-sm text-slate-500 shrink-0">.proposalai.app</span>
                        <button onClick={checkSubdomain} disabled={checkingSub || portalSubdomain.length < 3} className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${subdomainAvailable === true ? 'text-blue-400 border border-blue-500/20 bg-blue-500/5' : subdomainAvailable === false ? 'text-red-400 border border-red-500/20 bg-red-500/5' : 'text-slate-400 border border-white/[0.08] hover:text-white hover:bg-white/5'} disabled:opacity-40`}>
                            {checkingSub ? <Loader2 size={12} className="animate-spin" /> : subdomainAvailable === true ? <><CheckCircle2 size={12} /> Disponível</> : subdomainAvailable === false ? "Indisponível" : "Verificar"}
                        </button>
                    </div>
                    {subdomainMsg && (
                        <p className={`text-[10px] mt-1.5 ${subdomainAvailable ? 'text-blue-400' : 'text-red-400'}`}>{subdomainMsg}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                        <p className="text-[10px] text-slate-600 flex-1">URL do portal: <span className="text-slate-400">{portalUrl}</span></p>
                        <button onClick={() => copyText(portalUrl, "portal")} className={`p-1.5 rounded-lg transition-all ${copied === "portal" ? 'text-blue-400' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                            {copied === "portal" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        </button>
                        <a href={portalUrl} target="_blank" rel="noopener" className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"><ExternalLink size={12} /></a>
                    </div>
                </motion.div>

                {/* Custom Domain */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Lock size={16} className="text-blue-400" /> Domínio Personalizado</h3>
                        {domainVerified && (
                            <button onClick={() => setShowRemoveDomain(true)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Remover domínio</button>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Domínio</label>
                        <div className="flex gap-2">
                            <input type="text" value={customDomain} onChange={e => { setCustomDomain(e.target.value); setDomainVerified(false); setSslActive(false); setVerifyMsg(""); }} placeholder="propostas.suaempresa.com.br" className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            <button onClick={verifyDomain} disabled={!customDomain.trim() || verifying || domainVerified} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 disabled:opacity-40 ${domainVerified ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                                {verifying ? <><Loader2 size={14} className="animate-spin" /> Verificando...</> : domainVerified ? <><CheckCircle2 size={14} /> Verificado</> : <><Shield size={14} /> Verificar DNS</>}
                            </button>
                        </div>
                    </div>
                    {verifyMsg && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[10px] mt-2 ${domainVerified ? 'text-blue-400' : 'text-amber-400'}`}>{verifyMsg}</motion.p>
                    )}
                    {/* DNS records */}
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Configuração DNS Necessária</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2.5 bg-slate-900/50 rounded-lg">
                                <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">CNAME</span>
                                <span className="text-[11px] text-slate-300 font-mono flex-1 truncate">{customDomain || "seu-dominio"}</span>
                                <span className="text-slate-600 text-xs">→</span>
                                <span className="text-[11px] text-blue-400 font-mono">{cnameTarget}</span>
                                <button onClick={() => copyText(cnameTarget, "cname")} className={`p-1 rounded transition-all shrink-0 ${copied === "cname" ? 'text-blue-400' : 'text-slate-600 hover:text-white'}`}>
                                    {copied === "cname" ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 p-2.5 bg-slate-900/50 rounded-lg">
                                <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">TXT</span>
                                <span className="text-[11px] text-slate-300 font-mono flex-1">_verify</span>
                                <span className="text-slate-600 text-xs">→</span>
                                <span className="text-[11px] text-amber-400 font-mono">{verificationToken}</span>
                                <button onClick={() => copyText(verificationToken, "txt")} className={`p-1 rounded transition-all shrink-0 ${copied === "txt" ? 'text-blue-400' : 'text-slate-600 hover:text-white'}`}>
                                    {copied === "txt" ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                                </button>
                            </div>
                        </div>
                        {domainVerified && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-400">
                                <CheckCircle2 size={10} /> DNS verificado com sucesso
                            </div>
                        )}
                    </div>

                    {/* SSL */}
                    {domainVerified && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Shield size={16} className={sslActive ? "text-blue-400" : sslProvisioning ? "text-amber-400 animate-pulse" : "text-slate-500"} />
                                <div>
                                    <span className="text-sm text-white font-semibold block">Certificado SSL</span>
                                    <span className="text-[10px] text-slate-500">{sslActive ? "Let's Encrypt — Válido até Mar 2027" : sslProvisioning ? "Provisionando certificado..." : "Não configurado"}</span>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border ${sslActive ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : sslProvisioning ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
                                {sslActive ? "Ativo" : sslProvisioning ? "Provisionando" : "Inativo"}
                            </span>
                        </motion.div>
                    )}

                    {/* Custom URL */}
                    {domainVerified && customUrl && (
                        <div className="flex items-center gap-2 mt-3">
                            <p className="text-[10px] text-slate-600 flex-1">URL personalizada: <span className="text-blue-400">{customUrl}</span></p>
                            <button onClick={() => copyText(customUrl, "custom")} className={`p-1.5 rounded-lg transition-all ${copied === "custom" ? 'text-blue-400' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                                {copied === "custom" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                            </button>
                            <a href={customUrl} target="_blank" rel="noopener" className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all"><ExternalLink size={12} /></a>
                        </div>
                    )}
                </motion.div>

                {/* White Label */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Palette size={16} className="text-purple-400" />
                            <h3 className="text-sm font-bold text-white">White Label</h3>
                        </div>
                        <Toggle enabled={whitelabelEnabled} onChange={() => setWhitelabelEnabled(!whitelabelEnabled)} />
                    </div>
                    <p className="text-[11px] text-slate-500 mb-4">Remove a marca &quot;ProposalAI&quot; de todos os e-mails, PDFs e portal do cliente. Substitui pelo nome e logo da sua empresa.</p>
                    <AnimatePresence>
                        {whitelabelEnabled && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome da Marca</label>
                                        <input type="text" value={whitelabelName} onChange={e => setWhitelabelName(e.target.value)} placeholder="Nome da sua plataforma" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Logo Principal</label>
                                            <button onClick={() => logoRef.current?.click()} className="w-full px-4 py-3 bg-slate-800/50 border border-dashed border-white/[0.12] rounded-xl text-sm transition-all hover:bg-white/[0.02] hover:border-white/20 flex items-center justify-center gap-2">
                                                {whitelabelLogo ? (
                                                    <span className="text-blue-400 flex items-center gap-2 text-xs"><CheckCircle2 size={12} /> Logo enviado</span>
                                                ) : (
                                                    <span className="text-slate-500 flex items-center gap-2 text-xs"><Upload size={12} /> Upload logo (PNG/SVG)</span>
                                                )}
                                            </button>
                                            {whitelabelLogo && <button onClick={() => removeFile("logo")} className="text-[9px] text-red-400 mt-1 hover:text-red-300">Remover</button>}
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Favicon</label>
                                            <button onClick={() => faviconRef.current?.click()} className="w-full px-4 py-3 bg-slate-800/50 border border-dashed border-white/[0.12] rounded-xl text-sm transition-all hover:bg-white/[0.02] hover:border-white/20 flex items-center justify-center gap-2">
                                                {whitelabelFavicon ? (
                                                    <span className="text-blue-400 flex items-center gap-2 text-xs"><CheckCircle2 size={12} /> Favicon enviado</span>
                                                ) : (
                                                    <span className="text-slate-500 flex items-center gap-2 text-xs"><Image size={12} /> Upload favicon (ICO/PNG)</span>
                                                )}
                                            </button>
                                            {whitelabelFavicon && <button onClick={() => removeFile("favicon")} className="text-[9px] text-red-400 mt-1 hover:text-red-300">Remover</button>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Cor Primária</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={whitelabelPrimaryColor} onChange={e => setWhitelabelPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            <input type="text" value={whitelabelPrimaryColor} onChange={e => setWhitelabelPrimaryColor(e.target.value)} className="px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white font-mono w-32 focus:outline-none focus:border-blue-500/40" />
                                            <div className="flex gap-1.5">
                                                {["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"].map(c => (
                                                    <button key={c} onClick={() => setWhitelabelPrimaryColor(c)} className={`w-6 h-6 rounded-lg border-2 transition-all ${whitelabelPrimaryColor === c ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Texto do Rodapé (e-mails/PDF)</label>
                                        <input type="text" value={whitelabelFooter} onChange={e => setWhitelabelFooter(e.target.value)} placeholder="© 2026 Sua Empresa. Todos os direitos reservados." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                        <div>
                                            <span className="text-sm text-slate-300 block">Esconder &quot;Powered by ProposalAI&quot;</span>
                                            <span className="text-[10px] text-slate-600">Remove o selo em todos os pontos de contato</span>
                                        </div>
                                        <Toggle enabled={whitelabelHidePoweredBy} onChange={() => setWhitelabelHidePoweredBy(!whitelabelHidePoweredBy)} />
                                    </div>
                                    <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/5 transition-all">
                                        <Eye size={14} /> Preview White Label
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ═══ MODAL: White Label Preview ═══ */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center">
                                <h2 className="text-base font-bold text-white flex items-center gap-2"><Eye size={16} className="text-blue-400" /> Preview White Label</h2>
                                <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                            </div>
                            <div className="p-6">
                                <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                                    <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: whitelabelPrimaryColor + "15" }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: whitelabelPrimaryColor }}>{(whitelabelName || "P")[0]}</div>
                                            <span className="text-sm font-bold text-white">{whitelabelName || "Sua Marca"}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500">{customDomain || portalSubdomain + ".proposalai.app"}</span>
                                    </div>
                                    <div className="bg-slate-800/60 px-6 py-8 text-center">
                                        <h3 className="text-lg font-bold text-white mb-1">Portal do Cliente</h3>
                                        <p className="text-xs text-slate-400 mb-4">Suas propostas e documentos</p>
                                        <button className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: whitelabelPrimaryColor }}>Ver Propostas</button>
                                    </div>
                                    <div className="px-6 py-3 bg-slate-900/50 text-center">
                                        <span className="text-[9px] text-slate-600">{whitelabelFooter || `© 2026 ${whitelabelName || "Sua Empresa"}`}</span>
                                        {!whitelabelHidePoweredBy && <span className="text-[8px] text-slate-700 block mt-0.5">Powered by ProposalAI</span>}
                                    </div>
                                </div>
                                <div className="mt-4 rounded-xl overflow-hidden border border-white/[0.06]">
                                    <div className="px-4 py-2 bg-slate-800/60 text-[10px] text-slate-500 border-b border-white/[0.04]">Preview E-mail</div>
                                    <div className="bg-white p-6 text-center">
                                        <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: whitelabelPrimaryColor }}>{(whitelabelName || "P")[0]}</div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1">{whitelabelName || "Sua Marca"}</h4>
                                        <p className="text-xs text-slate-500 mb-3">Nova proposta disponível para revisão</p>
                                        <button className="px-5 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: whitelabelPrimaryColor }}>Ver Proposta →</button>
                                        <p className="text-[8px] text-slate-400 mt-4">{whitelabelFooter || `© 2026 ${whitelabelName || "Sua Empresa"}`}</p>
                                        {!whitelabelHidePoweredBy && <p className="text-[7px] text-slate-300 mt-0.5">Powered by ProposalAI</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/[0.06] flex justify-end">
                                <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5">Fechar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ MODAL: Remove Domain ═══ */}
            <AnimatePresence>
                {showRemoveDomain && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowRemoveDomain(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl w-full max-w-sm shadow-2xl p-6">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-400" /></div>
                                <h3 className="text-base font-bold text-white mb-1">Remover Domínio?</h3>
                                <p className="text-sm text-slate-400">O domínio <strong className="text-white">{customDomain}</strong> será desconectado. O certificado SSL será revogado.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowRemoveDomain(false)} className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl border border-white/[0.06] hover:bg-white/5">Cancelar</button>
                                <button onClick={removeDomain} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-xl font-semibold">Remover</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
