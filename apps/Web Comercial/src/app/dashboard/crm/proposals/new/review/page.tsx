"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Loader2,
    Sparkles,
    LayoutTemplate,
    AlertCircle,
    Info,
} from "lucide-react";
import { api } from "@/lib/api";
import {
    loadDraft,
    saveDraft,
    type ProposalDraft,
} from "../_shared";

import { WizardHeader } from "../_components/WizardHeader";

const SCOPE_PLACEHOLDER = `Escopo de Software — App de Delivery para Restaurante Local
Versão: 1.0
Tipo: Documento de Escopo Funcional
Plataformas: Mobile (iOS & Android) · Web (Painel Administrativo) · Tablet / App Operacional

1. Usuários do Sistema
Perfil | Descrição
Cliente | Realiza pedidos pelo aplicativo mobile ou web
Cozinha / Produção | Recebe e gerencia os pedidos em andamento
Entregador | Visualiza rotas, aceita e conclui entregas
Administrador | Gestão completa do sistema, cardápio e relatórios
Atendente / Caixa | Suporte ao cliente e registro de pedidos manuais

2. Plataforma
2.1 App do Cliente — iOS & Android (React Native)
Aplicativo móvel para o cliente final realizar pedidos, acompanhar entregas e gerenciar seu perfil.
2.2 Painel Administrativo — Web (React + Dashboard)
Interface web para o dono e administradores gerenciarem cardápio, pedidos, relatórios e entregadores.
2.3 App Operacional — Tablet (Cozinha) + Mobile (Entregador)
App simplificado para exibição de comandas na cozinha e roteiro de entregas para o entregador.

3. Módulos / Menu do Sistema
Módulo | Descrição | Plataforma | Perfil
Cardápio | Exibição de categorias, produtos, combos, fotos e preços | App Cliente · Web | Cliente
Carrinho & Pedido | Montagem do pedido, personalizações, observações e checkout | App Cliente | Cliente
Pagamento | Integração com meios de pagamento online e na entrega | App Cliente | Cliente
Rastreamento | Acompanhamento em tempo real do status e localização do pedido | App Cliente | Cliente
Avaliações | Nota e comentário do cliente após a entrega | App Cliente | Cliente
Gestão de Pedidos | Painel Kanban com etapas: recebido, em preparo, pronto, saiu para entrega | Web · Tablet | Cozinha · Admin
Cardápio Admin | CRUD de categorias, produtos, fotos, disponibilidade e preços | Web | Admin
Gestão de Entregadores | Cadastro, atribuição de pedidos, rastreamento e histórico | Web | Admin
Relatórios & Analytics | Vendas, ticket médio, produtos mais pedidos, tempo de entrega | Web | Admin
Promoções & Cupons | Criação e gestão de descontos, frete grátis e campanhas | Web · App Cliente | Admin · Cliente
Notificações | Push, SMS e e-mail em cada etapa do pedido | Todos | Cliente · Cozinha
Fidelidade / Pontos | Acúmulo de pontos por pedido e resgate em benefícios | App Cliente · Web | Cliente

4. Telas e Descrições
4.1 App do Cliente

Tela: Splash & Onboarding
Plataforma: App Mobile
Descrição: Tela de boas-vindas com logo do restaurante, slogan e botões de login/cadastro. No primeiro acesso, exibe um carrossel de 3 telas apresentando os diferenciais (delivery rápido, cardápio variado, pagamento seguro).
Funcionalidades:
- Login com e-mail e senha
- Login social (Google / Apple)
- Cadastro rápido de novo usuário
- Recuperação de senha via e-mail

Tela: Home / Cardápio
Plataforma: App Mobile
Descrição: Tela principal com banner promocional rotativo, chips de categorias (ex: Hambúrgueres, Bebidas, Sobremesas), lista de produtos em cards com foto, nome, descrição curta e preço. Barra de busca no topo e ícone do carrinho com badge de quantidade.
Funcionalidades:
- Filtro por categoria
- Busca por nome ou ingrediente
- Adicionar produto ao carrinho
- Ver detalhes do produto
- Destaque de produto em promoção

Tela: Detalhe do Produto
Plataforma: App Mobile
Descrição: Modal ou tela dedicada com foto em destaque, nome, descrição completa, ingredientes, opções de personalização (ex: ponto da carne, adicionais), campo de observações e botão de adicionar ao carrinho com seletor de quantidade.
Funcionalidades:
- Seleção de personalizações obrigatórias e opcionais
- Adicionais pagos (extras)
- Campo de observação livre
- Controle de quantidade antes de adicionar

Tela: Carrinho
Plataforma: App Mobile
Descrição: Lista dos itens adicionados com foto, nome, personalizações escolhidas, quantidade editável e preço unitário. Resumo com subtotal, taxa de entrega e campo de cupom de desconto. Botão de finalizar pedido fixo no rodapé.
Funcionalidades:
- Editar ou remover itens do carrinho
- Aplicar cupom de desconto
- Calcular frete por CEP
- Exibir estimativa de tempo de entrega

Tela: Checkout
Plataforma: App Mobile
Descrição: Fluxo em 3 etapas: (1) Endereço de entrega com mapa e autocomplete, (2) Forma de pagamento, (3) Revisão do pedido e confirmação. Exibe tempo estimado de entrega antes de finalizar.
Funcionalidades:
- Endereços salvos pelo cliente
- Pagamento por cartão, Pix ou dinheiro na entrega
- Campo para informar troco (pagamento em dinheiro)
- Agendamento de entrega para horário futuro

Tela: Acompanhamento do Pedido
Plataforma: App Mobile
Descrição: Linha do tempo com 5 etapas visuais: Pedido recebido -> Em preparo -> Pronto -> Saiu para entrega -> Entregue. Mapa em tempo real com a localização do entregador. Dados do entregador (nome, foto, avaliação média) e botão de ligação direta.
Funcionalidades:
- Rastreamento GPS do entregador ao vivo
- Push notification a cada mudança de etapa
- Contato direto com o entregador
- Cancelar pedido (disponível até o início do preparo)

Tela: Histórico & Avaliação
Plataforma: App Mobile
Descrição: Lista de pedidos anteriores com data, itens, total e status. Botão "Pedir novamente" para replicar um pedido. Após a entrega, prompt de avaliação com nota de 1 a 5 estrelas, emojis de reação e campo de comentário.
Funcionalidades:
- Repetir pedido anterior com um clique
- Avaliar produto e experiência de entrega
- Visualizar ou baixar nota fiscal em PDF

4.2 Painel Administrativo (Web)

Tela: Dashboard
Plataforma: Web
Descrição: Visão geral do dia com cards de KPIs: total de pedidos, faturamento, ticket médio e tempo médio de entrega. Gráfico de linha de pedidos por hora e lista de pedidos recentes com status. Alertas de itens sem estoque disponíveis.
Funcionalidades:
- KPIs exibidos em tempo real
- Filtro por período (dia, semana, mês)
- Exportação de dados em CSV e PDF

Tela: Gestão de Pedidos (Kanban)
Plataforma: Web · Tablet
Descrição: Colunas arrastáveis representando cada etapa do pedido. Cada card exibe número do pedido, itens resumidos, tempo decorrido e endereço de destino. Sons de alerta para novos pedidos. Modo comanda para impressão na cozinha.
Funcionalidades:
- Mover etapa com drag and drop
- Alerta sonoro para novos pedidos
- Imprimir comanda na impressora térmica
- Atribuir entregador manualmente ao pedido

Tela: Gerenciar Cardápio
Plataforma: Web
Descrição: Tabela de produtos com filtro por categoria, botões de editar, ativar/desativar e excluir. Formulário completo para criar ou editar produto: foto (upload), nome, descrição, categoria, preço, grupos de personalizações e disponibilidade por horário.
Funcionalidades:
- CRUD completo de produtos
- CRUD completo de categorias
- Upload e gerenciamento de imagens
- Ativar ou pausar item do cardápio
- Definir horários de disponibilidade por item

Tela: Entregadores
Plataforma: Web
Descrição: Lista de entregadores cadastrados com status (online/offline), pedido atual, avaliação média e histórico de entregas. Mapa com posição em tempo real de todos os entregadores online. Tela de cadastro com dados pessoais, veículo e documentos.
Funcionalidades:
- Mapa ao vivo com posição dos entregadores
- Atribuição manual de pedido a entregador
- Histórico completo de entregas por entregador
- Visualizar avaliações recebidas

Tela: Promoções & Cupons
Plataforma: Web
Descrição: Criação de cupons com código personalizado, tipo (porcentagem ou valor fixo), valor mínimo de pedido, quantidade de usos permitidos, data de validade e produtos ou categorias elegíveis. Relatório de utilização dos cupons por período.
Funcionalidades:
- Cupom de desconto percentual ou fixo
- Cupom de frete grátis
- Criação de combo promocional
- Relatório de resgate e aproveitamento

Tela: Relatórios
Plataforma: Web
Descrição: Relatórios segmentados por período, produto, categoria, bairro e entregador. Gráficos de barras e pizza para visualização rápida dos dados. Exportação em PDF e Excel para uso em reuniões de gestão ou envio ao contador.
Funcionalidades:
- Faturamento por período customizado
- Produtos mais vendidos
- Tempo médio de entrega por bairro
- Exportação em PDF e Excel

    // Adições para nível Profissional
Tela: Configurações do Sistema
Plataforma: Web
Descrição: Gerenciamento global do estabelecimento. Painel para definir horário de funcionamento, área de entrega (polígonos ou raio), taxas variáveis e chaves de API.
Funcionalidades:
- Configurar horário de funcionamento
- Desenhar área de entrega no mapa e taxa por km
- Configurar gateway de pagamento (Webhook e Tokens)
- Cadastrar usuários administradores e permissões granulares

5. Integrações
Pagamento
Stripe / Mercado Pago: Cartão de crédito/débito, Pix e carteiras digitais. Tokenização segura e módulo antifraude integrado.

Mapas & Geolocalização
Google Maps API: Autocomplete de endereço, cálculo de frete por distância e rastreamento do entregador ao vivo no mapa.

Notificações Push
Firebase (FCM): Notificações em tempo real para iOS e Android sobre status do pedido e campanhas promocionais.

Mensagens
Z-API / Twilio: Confirmações de pedido via WhatsApp e SMS.

E-mail Transacional
Resend / SendGrid: E-mails automáticos de confirmação e nota fiscal.

Autenticação Social
Google Sign-In / Apple Sign-In: Login rápido sem senha.

Armazenamento
AWS S3 / Cloudflare R2: Upload de imagens com CDN.

Impressão
Impressora Térmica (ESC/POS): Impressão automática na cozinha e recibo.
`;

// ─── Types ─────────────────────────────────────

interface ClientOption {
    id: string;
    name: string;
    company?: string;
    email?: string;
}

// ─── Page ─────────────────────────────────────

export default function ReviewProposalPage() {
    const router = useRouter();

    const [draft, setDraft] = useState<ProposalDraft | null>(null);
    const [scopeRaw, setScopeRaw] = useState("");
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load draft
    useEffect(() => {
        const d = loadDraft();
        if (!d) {
            router.replace("/dashboard/crm/proposals/new");
            return;
        }
        setDraft(d);
        setScopeRaw(d.scopeRaw || "");
    }, [router]);

    // Load clients (maybe needed for summary bar, but keeping for parity)
    useEffect(() => {
        setLoadingClients(true);
        api<ClientOption[]>("/api/clients")
            .then((res) => {
                if (res?.success && res.data) setClients(res.data);
            })
            .finally(() => setLoadingClients(false));
    }, []);

    const canAnalyze = scopeRaw.trim().length > 50;

    /** Persist the edited scope into the draft and navigate to Step 3. */
    const handleGoToGaps = () => {
        if (!draft) return;
        if (!canAnalyze) {
            setError("O escopo deve conter mais detalhes (mínimo de 50 caracteres) para uma análise eficaz da IA.");
            return;
        }
        setNavigating(true);
        setError(null);
        saveDraft({ ...draft, scopeRaw });
        router.push("/dashboard/crm/proposals/new/review/gaps");
    };

    if (!draft) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
        );
    }

    const client = clients.find(c => c.id === draft.clientId);

    return (
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => router.push("/dashboard/crm/proposals/new?back=true")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Voltar para Informações
            </button>

            <WizardHeader 
                title="Escopo Detalhado"
                subtitle="Passo 2 de 4 — Insira o escopo estruturado do seu projeto"
                currentStep={2}
            />

            {/* Main editor card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <LayoutTemplate size={16} className="text-blue-500" />
                    </div>
                    Documento de Escopo
                    <span className="ml-auto text-[10px] font-normal text-slate-500 max-w-[150px] text-right">
                        Use o layout livre. A IA o lerá da mesma forma.
                    </span>
                </h2>

                <div className="relative z-10 space-y-6">
                    {/* Summary bar */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                Proposta
                            </p>
                            <p className="text-sm font-bold text-white truncate">{draft.title || "—"}</p>
                        </div>
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                Cliente
                            </p>
                            <p className="text-sm font-bold text-white truncate">{client ? client.name : "Sem cliente"}</p>
                        </div>
                    </div>

                    {/* Scope textarea */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Descrição Completa do Escopo <span className="text-red-400">*</span>
                            </label>
                            <span className="text-[10px] text-slate-600 font-mono">
                                {scopeRaw.trim().length} caracteres
                            </span>
                        </div>

                        <div className="mb-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex gap-2">
                            <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Cole ou digite o escopo de software completo aqui. Utilize listas, numerações ou tópicos 
                                como no exemplo para que a Inteligência artificial consiga ler com clareza.
                            </p>
                        </div>

                        <textarea
                            value={scopeRaw}
                            onChange={(e) => setScopeRaw(e.target.value)}
                            placeholder={SCOPE_PLACEHOLDER}
                            rows={20}
                            spellCheck={false}
                            className="w-full bg-slate-900/60 border border-white/[0.08] rounded-xl px-4 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/40 transition-all resize-y leading-relaxed font-mono"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                    <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/[0.06]">
                <button
                    onClick={() => router.push("/dashboard/crm/proposals/new?back=true")}
                    disabled={navigating}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-40"
                >
                    <ChevronLeft size={18} />
                    Voltar
                </button>

                <button
                    onClick={handleGoToGaps}
                    disabled={navigating || !canAnalyze}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                    {navigating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Preparando análise…
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Analisar Lacunas com IA
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
