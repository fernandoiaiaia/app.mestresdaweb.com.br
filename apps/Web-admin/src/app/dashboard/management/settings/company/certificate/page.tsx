"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileBadge, UploadCloud, Lock, Eye, EyeOff, CheckCircle2, Save } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { institutionalService } from "@/services/institutional.service";

export default function CompanyCertificatePage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Cert state
    const [certFile, setCertFile] = useState<File | null>(null);
    const [certPassword, setCertPassword] = useState("");
    const [showCertPass, setShowCertPass] = useState(false);
    const [savedCertFilename, setSavedCertFilename] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await institutionalService.get();
            if (res.success && res.data && res.data.certFilename) {
                setSavedCertFilename(res.data.certFilename);
            }
        } catch (e) {
            toast.error("Erro", "Falha ao carregar dados do certificado.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async () => {
        if (!certFile && !savedCertFilename) {
            toast.error("Atenção", "Selecione um arquivo de certificado para enviar.");
            return;
        }

        if (certFile && !certPassword) {
            toast.error("Atenção", "Digite a senha do certificado.");
            return;
        }

        if (!certFile) {
            toast.success("Info", "Nenhuma alteração pendente de certificado.");
            return;
        }

        setIsSaving(true);
        try {
            const certRes = await institutionalService.uploadCertificate(certFile, certPassword);
            if (certRes.success) {
                toast.success("Sucesso", "Certificado enviado e configurado com sucesso!");
                setCertFile(null);
                setCertPassword("");
                if ('data' in certRes && certRes.data?.certFilename) {
                    setSavedCertFilename(certRes.data.certFilename);
                }
            } else {
                toast.error("Erro no Certificado", certRes.message || "Falha ao enviar arquivo.");
            }
        } catch (e) {
            toast.error("Erro", "Erro de conexão ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleSave}
                    disabled={isSaving || (!certFile && !savedCertFilename)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    {isSaving ? "Enviando..." : "Salvar Certificado"}
                </button>
            </div>

            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <FileBadge size={20} className="text-blue-400" /> Certificado Digital A1
                </h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                    Faça o upload do seu certificado digital (formato .pfx ou .p12) para habilitar a emissão de Notas Fiscais Eletrônicas de Serviço (NFS-e) diretamente pelo sistema.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Box */}
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Arquivo do Certificado</label>
                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center h-48 ${certFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'}`}>
                            <input 
                                type="file" 
                                accept=".pfx,.p12" 
                                className="hidden" 
                                id="cert-upload" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setCertFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <label htmlFor="cert-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                                {certFile ? (
                                    <>
                                        <FileBadge size={32} className="text-blue-400 mb-3" />
                                        <p className="text-sm font-bold text-white">{certFile.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{(certFile.size / 1024).toFixed(1)} KB</p>
                                        <span className="text-xs text-blue-400 mt-3 hover:underline">Trocar arquivo</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="text-slate-500 mb-3" />
                                        <p className="text-sm font-semibold text-slate-300">
                                            {savedCertFilename ? "Arquivo Atual: " + savedCertFilename : "Clique para selecionar o arquivo"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {savedCertFilename ? "Selecione outro para substituir" : "Suporta arquivos .pfx e .p12"}
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Config Box */}
                    <div className="space-y-5 flex flex-col">
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Senha do Certificado</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={16} className="text-slate-500" />
                                </div>
                                <input 
                                    type={showCertPass ? "text" : "password"} 
                                    value={certPassword}
                                    onChange={(e) => setCertPassword(e.target.value)}
                                    placeholder="Digite a senha de instalação"
                                    className="w-full pl-11 pr-12 py-3 bg-slate-900/80 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
                                />
                                <button 
                                    onClick={() => setShowCertPass(!showCertPass)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                                >
                                    {showCertPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2">A senha será criptografada em nosso banco de dados em padrão AES-256.</p>
                        </div>

                        {/* Status */}
                        {savedCertFilename && !certFile && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mt-auto">
                                <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400">Certificado Instalado</h4>
                                    <p className="text-xs text-emerald-500/80 mt-1">Existe um certificado digital atrelado a sua conta pronto para emissão de Notas Fiscais.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
