"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Star, Trophy, Users, Calendar, Code2, Cpu, Award, Play, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const SplineScene = dynamic(() => import("@/components/ui/splite").then(mod => mod.SplineScene), { ssr: false });

// ── Smooth Reveal ──
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-15%" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ── Counter Animation ──
function AnimatedNumber({ value, suffix = "" }: { value: string; suffix?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const numericPart = value.replace(/[^0-9.]/g, "");
    const prefix = value.replace(/[0-9.]/g, "");
    const [display, setDisplay] = useState("0");

    useEffect(() => {
        if (!isInView) return;
        // Remove dots (BR thousands separator) before parsing
        const target = parseFloat(numericPart.replace(/\./g, ""));
        const duration = 2000;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            setDisplay(current.toLocaleString("pt-BR"));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [isInView, numericPart]);

    return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

export default function CinematicMestresPresentation() {
    const { scrollYProgress } = useScroll();
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    // ── Parallax values ──
    const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.12], ["0%", "30%"]);

    const splineContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.style.scrollBehavior = "smooth";

        // ═══════════════════════════════════════════════════════════
        // NUCLEAR FIX: Override clientY/pageY/screenY directly on
        // the original PointerEvent and MouseEvent using Object.defineProperty.
        //
        // When Spline's internal listener reads `e.clientY`, it gets
        // OUR controlled value — not the raw browser value.
        //
        // This works regardless of where Spline registers its listeners
        // (window, document, canvas — doesn't matter).
        // No stopping propagation. No synthetic events. No infinite loops.
        // ═══════════════════════════════════════════════════════════

        const constrainY = (rawY: number): number => {
            // Lock Y to 40-50% of viewport height (robot eye level)
            // Never above 40% → never looks up → never falls backward
            const minY = window.innerHeight * 0.4;
            const maxY = window.innerHeight * 0.5;
            return Math.max(minY, Math.min(maxY, rawY));
        };

        const overrideY = (e: PointerEvent | MouseEvent) => {
            const controlledY = constrainY(e.clientY);
            try {
                Object.defineProperty(e, "clientY", { value: controlledY, configurable: true });
                Object.defineProperty(e, "pageY", { value: controlledY + window.scrollY, configurable: true });
                Object.defineProperty(e, "screenY", { value: controlledY + window.screenY, configurable: true });
                Object.defineProperty(e, "offsetY", { value: controlledY, configurable: true });
                Object.defineProperty(e, "y", { value: controlledY, configurable: true });
            } catch (_) {
                // Some properties may not be configurable in all browsers
            }
        };

        // Register on BOTH window and document, with CAPTURE phase (fires first)
        const targets = [window, document] as EventTarget[];
        const eventTypes = ["pointermove", "mousemove"] as const;

        for (const target of targets) {
            for (const type of eventTypes) {
                target.addEventListener(type, overrideY as EventListener, { capture: true });
            }
        }

        return () => {
            document.documentElement.style.scrollBehavior = "auto";
            for (const target of targets) {
                for (const type of eventTypes) {
                    target.removeEventListener(type, overrideY as EventListener, { capture: true });
                }
            }
        };
    }, []);

    const metrics = [
        { icon: Award, value: "+40", label: "Certificados e Selos", gradient: "from-amber-400 to-orange-500" },
        { icon: Trophy, value: "+1.300", label: "Projetos Entregues", gradient: "from-blue-400 to-indigo-500" },
        { icon: Users, value: "+1.000", label: "Clientes Atendidos", gradient: "from-violet-400 to-purple-500" },
        { icon: Calendar, value: "+12", label: "Anos de Empresa", gradient: "from-emerald-400 to-teal-500" },
        { icon: Code2, value: "+100", label: "Tipos de Tecnologias", gradient: "from-rose-400 to-pink-500" },
        { icon: Cpu, value: "+40", label: "Inteligências Artificiais", gradient: "from-cyan-400 to-sky-500" },
    ];

    const certificates = [
        { img: "/images/iso9001.webp", title: "ISO 9001", desc: "Certificado Internacional de Gestão da Qualidade" },
        { img: "/images/ISO 200001.webp", title: "ISO 200001", desc: "Certificado Internacional de Gestão em Tecnologia da Informação" },
        { img: "/images/iso27001.webp", title: "ISO 27001", desc: "Certificado Internacional de Segurança da Informação" },
        { img: "/images/iso27701.webp", title: "ISO 27701", desc: "Certificado Internacional de Lei Geral de Proteção de Dados (LGPD)" },
    ];

    const reviews = [
        { name: "Goodfirms", rating: 5, count: 116 },
        { name: "Clutch", rating: 5, count: 23 },
        { name: "Trustpilot", rating: 5, count: 19 },
        { name: "Google", rating: 4.6, count: 34 },
    ];

    return (
        <main className="bg-[#0a0a0f] text-white min-h-screen overflow-x-hidden antialiased">

            {/* 3D ROBOT — Spline works natively but Y is rewritten before it reads events */}
            <div className="fixed left-0 top-0 w-full lg:w-[50%] h-screen z-0 pointer-events-none lg:pointer-events-auto">
                <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0f_100%)] lg:bg-[radial-gradient(ellipse_at_center,transparent_50%,#0a0a0f_100%)]" />
                <div className="opacity-30 lg:opacity-100 w-full h-full">
                    <SplineScene
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 w-full z-50 pointer-events-none">
                <div className="flex items-center justify-between px-6 md:px-10 py-6">
                    <Image src="/branding/logo-ciano.png" alt="Mestres da Web" width={140} height={35} className="object-contain pointer-events-auto opacity-90 hover:opacity-100 transition-opacity" />
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════
                VIDEO MODAL (fullscreen overlay)
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isVideoOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-16"
                        onClick={() => setIsVideoOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setIsVideoOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110">
                                <X size={20} />
                            </button>
                            <iframe
                                width="100%" height="100%"
                                src="https://www.youtube.com/embed/nOrPZAwC39k?autoplay=1&color=white&modestbranding=1&rel=0"
                                frameBorder="0"
                                allow="autoplay; fullscreen; encrypted-media"
                                className="w-full h-full"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════════
                SCROLLABLE CONTENT (right column on desktop / full on mobile)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative z-10 w-full lg:w-1/2 lg:ml-auto">

                {/* ─── HERO ─── */}
                <section className="relative min-h-screen flex flex-col items-center lg:items-start justify-center px-8 md:px-16">
                    <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-2xl">
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-cyan-400 text-sm md:text-base font-medium tracking-widest uppercase mb-6"
                        >
                            Bem-vindos à
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8"
                        >
                            Mestres
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                                da Web
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-lg mb-12"
                        >
                            "Mentes e corações unidos por uma única paixão:
                            <span className="text-white font-medium"> Tecnologia.</span>"
                        </motion.p>

                        {/* Video CTA */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            onClick={() => setIsVideoOpen(true)}
                            className="group flex items-center gap-4 pointer-events-auto"
                        >
                            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow group-hover:scale-105 transition-transform">
                                <Play size={20} className="ml-1 fill-white text-white" />
                                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-30" />
                            </div>
                            <div className="text-left">
                                <p className="text-white text-sm font-semibold">Assistir vídeo</p>
                                <p className="text-white/40 text-xs">Conheça nossa história</p>
                            </div>
                        </motion.button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-10 left-1/2 lg:left-8 -translate-x-1/2 lg:translate-x-0 flex flex-col items-center gap-2"
                    >
                        <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
                        <ChevronDown size={16} className="text-white/30 animate-bounce" />
                    </motion.div>
                </section>

                {/* ─── METRICS ─── */}
                <section className="relative px-8 md:px-16 py-32">
                    <Reveal>
                        <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-4">Nossos números</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-20 leading-tight">
                            Números falam
                            <br />
                            <span className="text-white/20">mais que palavras.</span>
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-16 md:gap-y-20">
                        {metrics.map((stat, i) => (
                            <Reveal key={i} delay={i * 0.08}>
                                <div className="group pointer-events-auto">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <stat.icon size={20} className="text-white" />
                                    </div>
                                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-2">
                                        <AnimatedNumber value={stat.value} />
                                    </h3>
                                    <p className="text-sm md:text-base text-white/40 font-medium">
                                        {stat.label}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ─── DIVIDER ─── */}
                <div className="mx-8 md:mx-16 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                {/* ─── CERTIFICATES ─── */}
                <section className="relative px-8 md:px-16 py-32">
                    <Reveal>
                        <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-4">Certificações</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-16 leading-tight">
                            Certificações
                            <br />
                            <span className="text-white/20">Internacionais.</span>
                        </h2>
                    </Reveal>

                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                        {certificates.map((cert, i) => (
                            <Reveal key={i} delay={i * 0.1}>
                                <div className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-2xl p-6 md:p-8 transition-all duration-500 pointer-events-auto">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center p-3 mb-6 group-hover:scale-105 transition-transform shadow-lg">
                                        <Image src={cert.img} alt={cert.title} width={50} height={50} className="object-contain" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-1">{cert.title}</h3>
                                    <p className="text-xs md:text-sm text-white/40">{cert.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ─── DIVIDER ─── */}
                <div className="mx-8 md:mx-16 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                {/* ─── REVIEWS ─── */}
                <section className="relative px-8 md:px-16 py-32">
                    <Reveal>
                        <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-4">Avaliações</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
                            O que dizem
                            <br />
                            <span className="text-white/20">sobre nós.</span>
                        </h2>
                        <p className="text-white/40 text-lg max-w-lg mb-16 font-light leading-relaxed">
                            Falar de si mesmo é fácil, por isso temos avaliações que alguns clientes deixaram para nós e você pode conferir:
                        </p>
                    </Reveal>

                    <div className="space-y-4">
                        {reviews.map((rev, i) => (
                            <Reveal key={i} delay={i * 0.1}>
                                <div className="group flex items-center justify-between p-6 md:p-8 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 rounded-2xl transition-all duration-500 pointer-events-auto">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{rev.name}</h3>
                                        <p className="text-white/40 text-sm mb-2">{rev.count} avaliações</p>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, j) => (
                                                <Star key={j} size={16} className={`${j < Math.floor(rev.rating) ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/10"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{rev.rating}</span>
                                        <span className="text-white/30 text-lg font-light">/5</span>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={0.3}>
                        <div className="flex flex-col sm:flex-row gap-4 mt-12 pointer-events-auto">
                            <Link href="https://www.mestresdaweb.com.br/depoimentos-de-clientes" target="_blank" className="px-8 py-4 bg-white text-black text-sm font-bold rounded-full hover:bg-white/90 transition-colors text-center">
                                Ver Depoimentos
                            </Link>
                            <Link href="https://www.mestresdaweb.com.br/portfolio" target="_blank" className="px-8 py-4 border border-white/20 text-white text-sm font-bold rounded-full hover:bg-white/5 transition-colors text-center">
                                Ver Portfólio
                            </Link>
                        </div>
                    </Reveal>
                </section>

                {/* ─── DIVIDER ─── */}
                <div className="mx-8 md:mx-16 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                {/* ─── ACOMPANHAMENTO DO PROJETO ─── */}
                <section className="relative px-8 md:px-16 py-32 overflow-hidden">
                    {/* Decorative background orbs */}
                    <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

                    <Reveal>
                        <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-4">Acompanhamento</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
                            Como acompanhar
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">meu projeto?</span>
                        </h2>
                    </Reveal>

                    <Reveal delay={0.15}>
                        <p className="text-white/50 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-16">
                            Através do nosso <span className="text-white font-medium">Software e App interativo</span> que você irá acompanhar todo o desenvolvimento, enviar mensagens organizadas por telas, ver documentos, organizar entregas e muito mais. Também terá um <span className="text-white font-medium">grupo no WhatsApp</span> com seu gestor de projeto.
                        </p>
                    </Reveal>

                    <Reveal delay={0.25}>
                        <div className="relative group pointer-events-auto">
                            {/* Glow backdrop */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-indigo-500/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            {/* Card */}
                            <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-sm">
                                {/* Top accent line */}
                                <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                                
                                {/* Image */}
                                <div className="relative">
                                    <Image 
                                        src="/images/IMAGEM PROPOSTA.png" 
                                        alt="Software e App de acompanhamento de projetos da Mestres da Web"
                                        width={1200} 
                                        height={700} 
                                        className="w-full h-auto object-cover"
                                        priority
                                    />
                                    {/* Subtle bottom fade */}
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0f]/60 to-transparent" />
                                </div>

                                {/* Bottom info strip */}
                                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 p-6 md:p-8 border-t border-white/[0.05]">
                                    {[
                                        { emoji: "💬", label: "Mensagens por tela" },
                                        { emoji: "📄", label: "Documentos" },
                                        { emoji: "📦", label: "Entregas organizadas" },
                                        { emoji: "📱", label: "App Mobile" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2.5 text-white/50 hover:text-white/80 transition-colors">
                                            <span className="text-lg">{item.emoji}</span>
                                            <span className="text-xs md:text-sm font-medium tracking-wide">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* ─── DIVIDER ─── */}
                <div className="mx-8 md:mx-16 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                {/* ─── TEAM ─── */}
                <section className="relative px-8 md:px-16 py-32">
                    <div className="relative rounded-3xl overflow-hidden pointer-events-auto">
                        <Image src="/images/times mestres.png" alt="Equipe" width={800} height={500} className="w-full h-[400px] md:h-[500px] object-cover opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                            <Reveal>
                                <p className="text-cyan-400 text-xs font-medium tracking-widest uppercase mb-2">Nossa equipe</p>
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                                    Contamos os melhores <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">gênios</span> do mercado
                                </h2>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* ─── CLOSING ─── */}
                <section className="relative px-8 md:px-16 py-32 lg:py-48">
                    <Reveal>
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">
                                Mestres
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    da Web
                                </span>
                            </h2>
                            <p className="text-white/40 text-lg md:text-xl font-light leading-relaxed max-w-xl mb-12">
                                Mestres da Web, seu braço de tecnologia. Desenvolvemos softwares e aplicativos mobile sob medida, atuando como extensão estratégica da sua empresa para transformar ideias em soluções
                                <span className="text-white/70"> escaláveis</span>,
                                <span className="text-white/70"> seguras</span> e orientadas ao
                                <span className="text-white/70"> crescimento</span>.
                            </p>
                            <button
                                onClick={() => window.close()}
                                className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:scale-105 pointer-events-auto"
                            >
                                Voltar para a Proposta
                            </button>
                        </div>
                    </Reveal>
                </section>

                {/* Bottom spacing */}
                <div className="h-20" />

            </div>
        </main>
    );
}
