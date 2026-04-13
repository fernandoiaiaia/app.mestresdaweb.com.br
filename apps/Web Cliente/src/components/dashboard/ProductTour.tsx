"use client";

import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import confetti from "canvas-confetti";
import { useAuthStore } from "@/stores/auth";
import { PartyPopper } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useRef } from "react";

export default function ProductTour() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [showGreeting, setShowGreeting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!user?.id) return; // Wait for user hydration
        
        const tourKey = `hasSeenTour_v2_${user.id}`;
        const hasSeenTour = localStorage.getItem(tourKey);
        
        if (!hasSeenTour) {
            setIsLocked(true); // Bloqueia a tela imediatamente antes mesmo da saudação carregar
            // Delay a bit to let the dashboard render
            const timer = setTimeout(() => {
                setShowGreeting(true);
                runFireworks();

                // Start tour after a delay
                setTimeout(() => {
                    setShowGreeting(false);
                    startTour();
                    // Devolve o controle para o driver.js 
                    setTimeout(() => setIsLocked(false), 100);
                }, 3000);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    const runFireworks = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    const disableTour = () => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id) {
            localStorage.setItem(`hasSeenTour_v2_${currentUser.id}`, "true");
        }
        // We ensure driver is destroyed inside the global window call
        const currentDriver = (window as any).__driverObj;
        if (currentDriver) currentDriver.destroy();
    };

    const startTour = () => {
        const buildDesc = (text: string) => 
            `${text} <div class="mt-4 pt-4 border-t border-slate-700/50 flex justify-start"><button onclick="window.disableTourLocally()" class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto">Não mostrar novamente</button></div>`;

        const waitAndMove = (action: () => void) => {
            setTimeout(() => {
                action();
            }, 600); // Aguarda renderização da página do next.js
        };

        const requireClickToRelease = (el: Element | null | undefined) => {
            if (!el) return;
            
            // Força a inserção da classe no popover principal
            setTimeout(() => {
                const pop = document.querySelector('.driver-popover');
                if (pop) {
                    pop.classList.remove('driver-unlocked-next');
                    pop.classList.add('driver-lock-next');
                }
            }, 50);

            const clickHandler = () => {
                // REMOVIDO: e.preventDefault() e e.stopPropagation()
                // Deixamos o Next.js agir naturalmente com <Link> permitindo o clique único funcionar.
                
                const pop = document.querySelector('.driver-popover');
                if (pop) {
                    pop.classList.remove('driver-lock-next');
                    pop.classList.add('driver-unlocked-next');
                }

                // Como ele já atendeu a instrução de clicar, nós avançamos o tutorial junto com o carregamento da nova rota.
                waitAndMove(() => driverObj.moveNext());
            };

            // Captura o clique nativo antes do Next.js disparar a rota (capture: true)
            el.addEventListener('click', clickHandler, { once: true, capture: true });
        };

        const checkDisabled = () => {
            const pop = document.querySelector('.driver-popover');
            return pop?.classList.contains('driver-lock-next');
        };

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: false,
            doneBtnText: "Concluir Tour",
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            showButtons: ['next', 'previous'],
            popoverClass: "bg-slate-900 border border-slate-700 text-white shadow-2xl rounded-xl",
            onDestroyStarted: () => {
                driverObj.destroy();
            },
            steps: [
                // ════════════════════════════════════════
                // DASHBOARD
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-dashboard",
                    popover: { title: "Visão Geral", description: buildDesc("Aqui é o seu porto seguro. Acompanhe métricas, atividades recentes e a saúde geral de todos os projetos em um só lugar.") }
                },
                {
                    element: "#tour-dashboard-stats",
                    popover: { title: "Métricas Principais", description: buildDesc("Acompanhe de perto as tarefas ativas, documentos pendentes e entregas sem precisar entrar em cada projeto individualmente.") }
                },
                {
                    element: "#tour-dashboard-charts",
                    popover: { title: "Análise Visual", description: buildDesc("Gráficos em tempo real mostram sua produtividade mensal e a divisão dos status das suas tarefas.") }
                },
                {
                    element: "#tour-dashboard-activity",
                    popover: { title: "Atividades Recentes", description: buildDesc("Um resumo cronológico das últimas atualizações para você nunca perder o fio da meada do que a equipe está trabalhando.") }
                },
                
                // ════════════════════════════════════════
                // PROJECTS
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-projects",
                    popover: { 
                        popoverClass: "driver-lock-next",
                        title: "Hora da Prática", 
                        description: buildDesc("<p class='font-black text-white text-[13px] mb-2 bg-blue-500/20 px-3 py-1.5 rounded border border-blue-500/30 text-center uppercase tracking-wide'>👆 Clique fisicamente na aba Projetos</p><p>A partir de agora aprenda navegando. O botão foi inativado. Dê um clique real no menu para avançar.</p>")
                    },
                    onHighlightStarted: requireClickToRelease
                },
                {
                    element: "#tour-page-projects-header",
                    popover: { title: "Página de Projetos", description: buildDesc("Lista completa de todos os sistemas e escopos contratados que estão em execução pela nossa equipe.") },
                    onPrevClick: () => { router.push('/dashboard'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-page-projects-list",
                    popover: { title: "Status do Projeto", description: buildDesc("O acompanhamento detalhado com barra de progresso, prazos precisos e status em tempo real.") }
                },

                // ════════════════════════════════════════
                // DOCUMENTS
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-documents",
                    popover: { 
                        popoverClass: "driver-lock-next",
                        title: "Arquivos Seguros", 
                        description: buildDesc("<p class='font-black text-white text-[13px] mb-2 bg-blue-500/20 px-3 py-1.5 rounded border border-blue-500/30 text-center uppercase tracking-wide'>👆 Clique em Documentos</p><p>Dê um clique real na plataforma para progredir para essa página.</p>")
                    },
                    onHighlightStarted: requireClickToRelease
                },
                {
                    element: "#tour-page-docs-header",
                    popover: { title: "Gestão de Documentos", description: buildDesc("Centralizamos seus arquivos, contratos e plantas aqui. Nunca mais se perca.") },
                    onPrevClick: () => { router.push('/dashboard/projects'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-page-docs-categories",
                    popover: { title: "Categorias de Documentação", description: buildDesc("BRDs, Contratos, Roadmaps... Você pode baixar, visualizar ou apenas usar esse local como seu drive criptografado.") }
                },

                // ════════════════════════════════════════
                // DELIVERIES
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-deliveries",
                    popover: { 
                        popoverClass: "driver-lock-next",
                        title: "Monitoramento Constante", 
                        description: buildDesc("<p class='font-black text-white text-[13px] mb-2 bg-blue-500/20 px-3 py-1.5 rounded border border-blue-500/30 text-center uppercase tracking-wide'>👆 Clique em Entregas</p><p>Dê um clique no menu indicado para ser direcionado.</p>")
                    },
                    onHighlightStarted: requireClickToRelease
                },
                {
                    element: "#tour-page-deliveries-header",
                    popover: { title: "Controle de Entregas", description: buildDesc("A visão microscópica de Sprints e prazos curtos.") },
                    onPrevClick: () => { router.push('/dashboard/projects/documents'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-page-deliveries-filters",
                    popover: { title: "Indicadores de Prazos", description: buildDesc("Acompanhe o que já publicamos, o que está ativo no momento e o backlog estagnado de forma gerencial.") }
                },
                {
                    element: "#tour-page-deliveries-list",
                    popover: { title: "Histórico Limpo", description: buildDesc("Você consegue entender exatamente por que e quando cada entrega de código ocorreu ou onde atrasamos.") }
                },

                // ════════════════════════════════════════
                // PROPOSALS
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-proposals",
                    popover: { 
                        popoverClass: "driver-lock-next",
                        title: "Negociações", 
                        description: buildDesc("<p class='font-black text-white text-[13px] mb-2 bg-blue-500/20 px-3 py-1.5 rounded border border-blue-500/30 text-center uppercase tracking-wide'>👆 Clique em Proposta</p><p>Interaja com o link brilhante no próprio sistema para avançarmos.</p>")
                    },
                    onHighlightStarted: requireClickToRelease
                },
                {
                    element: "#tour-page-proposals-header",
                    popover: { title: "Propostas Comerciais", description: buildDesc("Possui um novo escopo de projeto que discutimos? Aqui acompanhamos a tramitação burocrática.") },
                    onPrevClick: () => { router.push('/dashboard/projects/deliveries'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-page-proposals-list",
                    popover: { title: "Faturamentos e Valores", description: buildDesc("Você aprova, rejeita e tem rastreabilidade completa das propostas de horas lançadas.") }
                },

                // ════════════════════════════════════════
                // NOTIFICATIONS
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-notifications",
                    popover: { 
                        popoverClass: "driver-lock-next",
                        title: "Seus Alertas", 
                        description: buildDesc("<p class='font-black text-white text-[13px] mb-2 bg-blue-500/20 px-3 py-1.5 rounded border border-blue-500/30 text-center uppercase tracking-wide'>👆 Clique em Notificações</p><p>Siga com 1 único clique no menu lateral esquerdo.</p>")
                    },
                    onHighlightStarted: requireClickToRelease
                },
                {
                    element: "#tour-page-notifications-header",
                    popover: { title: "Notificações do Sistema", description: buildDesc("Todos os rastros das automações invisíveis.") },
                    onPrevClick: () => { router.push('/dashboard/proposals'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-page-notifications-search",
                    popover: { title: "Log de Auditoria", description: buildDesc("Você pode buscar menções antigas, comentários de desenvolvedores ou prazos com os filtros focados do motor de buscas.") }
                },

                // ════════════════════════════════════════
                // MISC & PROFILE
                // ════════════════════════════════════════
                {
                    element: "#tour-sidebar-settings",
                    popover: { title: "Configurações Globais", description: buildDesc("Gerencie convites para os diretores da sua empresa, ou ajuste padrões e métodos organizacionais.") },
                    onPrevClick: () => { router.push('/dashboard/notifications'); waitAndMove(() => driverObj.movePrevious()); }
                },
                {
                    element: "#tour-sidebar-profile",
                    popover: { title: "Perfil & Sair", description: buildDesc("Ajuste sua foto de perfil ou faça o logout com segurança. Divirta-se na plataforma!") },
                    onNextClick: () => { router.push('/dashboard'); waitAndMove(() => driverObj.moveNext()); }
                }
            ]
        });

        // Store reference globally so the inline HTML button can call it
        (window as any).disableTourLocally = disableTour;
        (window as any).__driverObj = driverObj;

        driverObj.drive();
    };

    if (!isLocked && !showGreeting) return null;

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] pointer-events-auto transition-colors duration-500 ${showGreeting ? 'bg-slate-950/60 backdrop-blur-sm' : 'bg-transparent'}`}>
            {showGreeting && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <PartyPopper size={32} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Bem-vindo(a), {user?.name?.split(' ')[0] || 'mestre'}!</h2>
                        <p className="text-slate-400 text-sm">Estamos muito felizes em ter você aqui. Aproveite a plataforma.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
