"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
    ChevronLeft,
    Settings,
    Package,
    Save,
    X,
    Plus,
    Trash2,
    Info,
    DollarSign,
    Clock,
    Layers,
    Server,
    Code,
    Monitor,
    Smartphone,
    Palette,
    Shield,
    BarChart3,
    Headphones,
    GraduationCap,
    Zap,
    Globe,
    Database,
    Cloud,
    GitBranch,
    Search as SearchIcon,
    FileText,
    BrainCircuit,
    Megaphone,
    Boxes,
    CheckCircle2,
    Loader2,
} from "lucide-react";

// ═══ TYPES ═══
type ProductType = "servico" | "produto" | "combo" | "assinatura";
type BillingModel = "unico" | "mensal" | "trimestral" | "semestral" | "anual" | "sob-demanda" | "por-hora";

interface Deliverable {
    id: string;
    name: string;
}

interface ApiCategory {
    id: string;
    name: string;
    color: string;
}

// ═══ CONFIG ═══
const typeConfig: Record<ProductType, { label: string; color: string; emoji: string; description: string }> = {
    servico: { label: "Serviço", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", emoji: "⚙️", description: "Trabalho executado sob demanda ou contrato" },
    produto: { label: "Produto", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", emoji: "📦", description: "Software, licença ou entregável digital" },
    combo: { label: "Combo / Pacote", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", emoji: "🎁", description: "Combinação de serviços e/ou produtos" },
    assinatura: { label: "Assinatura", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", emoji: "🔄", description: "Serviço contínuo com cobrança recorrente" },
};

const billingLabels: Record<BillingModel, string> = {
    unico: "Pagamento Único", mensal: "Mensal", trimestral: "Trimestral",
    semestral: "Semestral", anual: "Anual", "sob-demanda": "Sob Demanda", "por-hora": "Por Hora",
};

const defaultCategoryIcons: Record<string, any> = {
    "Desenvolvimento Web": Globe, "Desenvolvimento Mobile": Smartphone, "Software Desktop": Monitor,
    "APIs & Integrações": GitBranch, "Back-end & Microsserviços": Code, "Design UI/UX": Palette,
    "Infraestrutura & DevOps": Server, "Cloud & Hospedagem": Cloud, "Banco de Dados": Database,
    "Segurança & LGPD": Shield, "IA & Machine Learning": BrainCircuit, "Automação & RPA": Zap,
    "Consultoria Técnica": Headphones, "Manutenção & Suporte": Shield, "SEO & Marketing Digital": Megaphone,
    "Analytics & BI": BarChart3, "Treinamento & Capacitação": GraduationCap, "Documentação Técnica": FileText,
    "E-commerce": Boxes,
};

const complexityLevels = [
    { value: "low", label: "Baixa", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", description: "Até 40h — projetos simples e repetíveis" },
    { value: "medium", label: "Média", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", description: "40–160h — customização e integrações" },
    { value: "high", label: "Alta", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", description: "160–500h — projetos sob medida" },
    { value: "enterprise", label: "Empresarial", color: "text-red-400 bg-red-500/10 border-red-500/20", description: "500h+ — soluções complexas e escaláveis" },
];

const techStackOptions = [
    { group: "Frontend", items: ["React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "Bootstrap"] },
    { group: "Backend", items: ["Node.js", "Express", "NestJS", "Python", "Django", "FastAPI", "PHP", "Laravel", "Java", "Spring Boot", ".NET", "Go", "Ruby on Rails"] },
    { group: "Mobile", items: ["React Native", "Flutter", "Swift (iOS)", "Kotlin (Android)", "Expo", "Ionic"] },
    { group: "Banco de Dados", items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Firebase", "Supabase", "SQLite"] },
    { group: "Cloud & DevOps", items: ["AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Vercel", "Netlify", "DigitalOcean", "Heroku", "CI/CD"] },
    { group: "CMS & Ferramentas", items: ["WordPress", "Strapi", "Sanity", "Prisma", "GraphQL", "REST API"] },
    { group: "IA & Automação", items: ["OpenAI / GPT", "LangChain", "TensorFlow", "n8n", "Zapier", "Make (Integromat)", "Power Automate"] },
];

const uid = () => "id-" + Math.random().toString(36).slice(2, 9);

export default function NewProductPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Categories from API
    const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);

    // Basic info
    const [name, setName] = useState("");
    const [internalCode, setInternalCode] = useState("");
    const [description, setDescription] = useState("");
    const [detailedDescription, setDetailedDescription] = useState("");
    const [type, setType] = useState<ProductType>("servico");
    const [categoryId, setCategoryId] = useState("");

    // Pricing
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [billingModel, setBillingModel] = useState<BillingModel>("unico");
    const [setupFee, setSetupFee] = useState("");

    // Scope
    const [complexity, setComplexity] = useState("medium");
    const [estimatedHours, setEstimatedHours] = useState("");
    const [slaResponse, setSlaResponse] = useState("");
    const [slaResolution, setSlaResolution] = useState("");

    // Deliverables
    const [deliverables, setDeliverables] = useState<Deliverable[]>([{ id: uid(), name: "" }]);

    // Tech Stack
    const [selectedTech, setSelectedTech] = useState<string[]>([]);
    const [techSearch, setTechSearch] = useState("");

    // Commercial
    const [marginPercent, setMarginPercent] = useState("");
    const [discountMax, setDiscountMax] = useState("");
    const [warrantyMonths, setWarrantyMonths] = useState("3");

    // Visibility
    const [active, setActive] = useState(true);
    const [showInProposals, setShowInProposals] = useState(true);
    const [featured, setFeatured] = useState(false);

    // ═══ Load Categories ═══
    useEffect(() => {
        (async () => {
            try {
                const res = await api<ApiCategory[]>("/api/products/categories", { method: "GET" });
                if (res.success && res.data) {
                    setApiCategories(res.data);
                    if (res.data.length > 0 && !categoryId) setCategoryId(res.data[0].id);
                }
            } catch (e) { console.error(e); }
            finally { setLoadingCats(false); }
        })();
    }, []);

    // ═══ Deliverables ═══
    const addDeliverable = () => setDeliverables(prev => [...prev, { id: uid(), name: "" }]);
    const updateDeliverable = (id: string, value: string) => setDeliverables(prev => prev.map(d => d.id === id ? { ...d, name: value } : d));
    const removeDeliverable = (id: string) => setDeliverables(prev => prev.filter(d => d.id !== id));

    // ═══ Tech Stack ═══
    const toggleTech = (tech: string) => {
        setSelectedTech(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    };

    const filteredTechGroups = techStackOptions.map(group => ({
        ...group,
        items: group.items.filter(item => item.toLowerCase().includes(techSearch.toLowerCase())),
    })).filter(g => g.items.length > 0);

    // ═══ Validation ═══
    const isValid = name.trim().length > 0 && categoryId;

    // ═══ Save ═══
    const handleSave = async () => {
        if (!isValid || saving) return;
        setSaving(true);
        try {
            const body = {
                name: name.trim(),
                internalCode: internalCode.trim() || null,
                description: description.trim() || null,
                detailedDescription: detailedDescription.trim() || null,
                type,
                categoryId,
                priceMin: parseFloat(priceMin) || 0,
                priceMax: parseFloat(priceMax) || 0,
                billingModel,
                setupFee: parseFloat(setupFee) || 0,
                marginPercent: parseFloat(marginPercent) || 0,
                discountMax: parseFloat(discountMax) || 0,
                warrantyMonths: parseInt(warrantyMonths) || 3,
                complexity,
                estimatedHours: parseInt(estimatedHours) || null,
                slaResponse: slaResponse.trim() || null,
                slaResolution: slaResolution.trim() || null,
                deliverables: deliverables.map(d => d.name).filter(n => n.trim()),
                techStack: selectedTech,
                active,
                showInProposals,
                featured,
            };

            const res = await api("/api/products", { method: "POST", body });
            if (res.success) {
                router.push("/dashboard/settings/products");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const selectedCategory = apiCategories.find(c => c.id === categoryId);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32">
            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <Link href="/dashboard/settings/products" className="text-slate-500 hover:text-slate-300 text-sm">Produtos e Serviços</Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Novo Item</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Package size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Novo Produto ou Serviço</h1>
                        <p className="text-sm text-slate-400">Cadastre um novo item para usar em propostas comerciais</p>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-8">
                {/* ══════════════════════════════════════════
                   SECTION 1: Informações Básicas
                ══════════════════════════════════════════ */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Info size={16} className="text-blue-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Informações Básicas</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        {/* Type */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Tipo do Item <span className="text-red-400">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(Object.keys(typeConfig) as ProductType[]).map(t => {
                                    const tc = typeConfig[t];
                                    const selected = type === t;
                                    return (
                                        <button key={t} type="button" onClick={() => setType(t)} className={`p-3 rounded-xl text-left transition-all border ${selected ? tc.color : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{tc.emoji}</span>
                                                <span className={`text-xs font-bold ${selected ? '' : 'text-slate-400'}`}>{tc.label}</span>
                                            </div>
                                            <p className={`text-[10px] leading-tight ${selected ? 'opacity-80' : 'text-slate-600'}`}>{tc.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Name + Code */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Nome do Item <span className="text-red-400">*</span></label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Desenvolvimento de Site Institucional" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Código Interno</label>
                                <input type="text" value={internalCode} onChange={e => setInternalCode(e.target.value)} placeholder="Ex: DEV-WEB-001" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 font-mono" />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição Resumida</label>
                            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Este texto aparecerá na proposta comercial para o cliente..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                        </div>

                        {/* Detailed description */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Descrição Técnica Detalhada</label>
                            <textarea rows={4} value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} placeholder="Detalhes técnicos, stack utilizada, metodologia, requisitos mínimos..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 resize-none" />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Categoria <span className="text-red-400">*</span></label>
                            {loadingCats ? (
                                <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={14} className="animate-spin" /> Carregando categorias...</div>
                            ) : apiCategories.length === 0 ? (
                                <div className="text-sm text-slate-500">Nenhuma categoria cadastrada. <Link href="/dashboard/settings/products" className="text-blue-400 hover:text-blue-300">Crie uma categoria primeiro</Link>.</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {apiCategories.map(cat => {
                                        const Icon = defaultCategoryIcons[cat.name] || Package;
                                        const selected = categoryId === cat.id;
                                        return (
                                            <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${selected ? '' : 'border-white/[0.06] hover:border-white/[0.12]'}`} style={selected ? { color: cat.color, backgroundColor: `${cat.color}12`, borderColor: `${cat.color}30` } : undefined}>
                                                <Icon size={16} className={selected ? '' : 'text-slate-500'} style={selected ? { color: cat.color } : undefined} />
                                                <span className={`text-xs font-medium truncate ${selected ? '' : 'text-slate-400'}`}>{cat.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════
                   SECTION 2: Precificação
                ══════════════════════════════════════════ */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <DollarSign size={16} className="text-blue-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Precificação</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Preço Mínimo (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                    <input type="number" min="0" step="0.01" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0,00" className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Preço Máximo (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                    <input type="number" min="0" step="0.01" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="0,00" className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Taxa de Setup (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                    <input type="number" min="0" step="0.01" value={setupFee} onChange={e => setSetupFee(e.target.value)} placeholder="0,00" className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Modelo de Cobrança</label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.entries(billingLabels) as [BillingModel, string][]).map(([key, label]) => (
                                    <button key={key} type="button" onClick={() => setBillingModel(key)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${billingModel === key ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'border-white/[0.06] text-slate-500 hover:text-white'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Margem de Lucro (%)</label>
                                <input type="number" min="0" max="100" value={marginPercent} onChange={e => setMarginPercent(e.target.value)} placeholder="30" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Desconto Máximo (%)</label>
                                <input type="number" min="0" max="100" value={discountMax} onChange={e => setDiscountMax(e.target.value)} placeholder="15" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Garantia (meses)</label>
                                <input type="number" min="0" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} placeholder="3" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════
                   SECTION 3: Escopo & SLA
                ══════════════════════════════════════════ */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Clock size={16} className="text-amber-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Escopo & SLA</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Complexidade</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {complexityLevels.map(level => {
                                    const selected = complexity === level.value;
                                    return (
                                        <button key={level.value} type="button" onClick={() => setComplexity(level.value)} className={`p-3 rounded-xl text-left transition-all border ${selected ? level.color : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                                            <span className={`text-xs font-bold block mb-0.5 ${selected ? '' : 'text-slate-400'}`}>{level.label}</span>
                                            <p className={`text-[10px] leading-tight ${selected ? 'opacity-80' : 'text-slate-600'}`}>{level.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">Horas Estimadas</label>
                                <input type="number" min="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="80" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">SLA — Resposta</label>
                                <input type="text" value={slaResponse} onChange={e => setSlaResponse(e.target.value)} placeholder="Ex: 4 horas úteis" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">SLA — Resolução</label>
                                <input type="text" value={slaResolution} onChange={e => setSlaResolution(e.target.value)} placeholder="Ex: 24 horas úteis" className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entregas / Deliverables</label>
                                <button type="button" onClick={addDeliverable} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
                                    <Plus size={12} /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {deliverables.map((d, idx) => (
                                    <div key={d.id} className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-600 w-5 text-right shrink-0">{idx + 1}.</span>
                                        <input type="text" value={d.name} onChange={e => updateDeliverable(d.id, e.target.value)} placeholder="Ex: Protótipo interativo no Figma" className="flex-1 px-3 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40" />
                                        {deliverables.length > 1 && (
                                            <button type="button" onClick={() => removeDeliverable(d.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════
                   SECTION 4: Stack Tecnológica
                ══════════════════════════════════════════ */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Layers size={16} className="text-indigo-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Stack Tecnológica</h2>
                        {selectedTech.length > 0 && (
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">{selectedTech.length} selecionadas</span>
                        )}
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input type="text" value={techSearch} onChange={e => setTechSearch(e.target.value)} placeholder="Buscar tecnologia..." className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40" />
                        </div>

                        {selectedTech.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedTech.map(tech => (
                                    <span key={tech} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20">
                                        {tech}
                                        <button type="button" onClick={() => toggleTech(tech)} className="hover:text-white"><X size={12} /></button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                            {filteredTechGroups.map(group => (
                                <div key={group.group}>
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1.5">{group.group}</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.items.map(item => {
                                            const selected = selectedTech.includes(item);
                                            return (
                                                <button key={item} type="button" onClick={() => toggleTech(item)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30' : 'text-slate-500 border-white/[0.06] hover:text-white hover:bg-white/5'}`}>
                                                    {selected && <CheckCircle2 size={10} className="inline mr-1" />}{item}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ══════════════════════════════════════════
                   SECTION 5: Visibilidade
                ══════════════════════════════════════════ */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
                        <Package size={16} className="text-blue-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visibilidade & Status</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: "Item Ativo", description: "Disponível para seleção em novas propostas", value: active, onChange: () => setActive(!active) },
                                { label: "Exibir em Propostas", description: "Aparece no catálogo para seleção dos advisors", value: showInProposals, onChange: () => setShowInProposals(!showInProposals) },
                                { label: "Item Destaque", description: "Prioritário na listagem e com selo de destaque", value: featured, onChange: () => setFeatured(!featured) },
                            ].map(toggle => (
                                <button key={toggle.label} type="button" onClick={toggle.onChange} className={`p-4 rounded-xl border text-left transition-all ${toggle.value ? 'bg-blue-500/5 border-blue-500/20' : 'border-white/[0.06]'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold ${toggle.value ? 'text-white' : 'text-slate-400'}`}>{toggle.label}</span>
                                        <div className={`w-8 h-[18px] rounded-full transition-all relative ${toggle.value ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all ${toggle.value ? 'left-[17px]' : 'left-[2px]'}`} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">{toggle.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* ═══ Sticky Bottom Bar ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/[0.08] p-4 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {name && (
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{typeConfig[type].emoji}</span>
                                <div>
                                    <span className="text-sm font-bold text-white block">{name}</span>
                                    <span className="text-[10px] text-slate-500">{selectedCategory?.name || "Sem categoria"}{priceMin ? ` • a partir de R$ ${parseFloat(priceMin).toLocaleString("pt-BR")}` : ""}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/settings/products" className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2">
                            <X size={14} /> Cancelar
                        </Link>
                        <button onClick={handleSave} disabled={!isValid || saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? "Salvando..." : "Criar Item"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
