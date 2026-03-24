"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSDRStore, type CadenceNode, type CadenceEdge } from "@/store/sdr-store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    type Connection,
    type Node,
    type Edge,
    Panel,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    ArrowLeft,
    Mail,
    MessageSquare,
    Phone,
    Clock,
    HelpCircle,
    Flag,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    CalendarCheck,
    UserPlus,
    Save,
    Play,
    Eye,
    Trash2,
    X,
    Plus,
    BrainCircuit,
    Sparkles,
} from "lucide-react";

// ═══════════════════════════════════
// NODE TYPE CONFIG
// ═══════════════════════════════════
const nodeTypeConfig: Record<string, { label: string; icon: any; color: string; bg: string; category: string }> = {
    start: { label: "Início", icon: Flag, color: "text-blue-400", bg: "border-blue-500/40 bg-blue-500/10", category: "control" },
    email: { label: "Enviar E-mail", icon: Mail, color: "text-blue-400", bg: "border-blue-500/40 bg-blue-500/10", category: "action" },
    whatsapp: { label: "Enviar WhatsApp", icon: MessageSquare, color: "text-blue-400", bg: "border-blue-500/40 bg-blue-500/10", category: "action" },
    phone: { label: "Fazer Ligação", icon: Phone, color: "text-blue-400", bg: "border-blue-500/40 bg-blue-500/10", category: "action" },
    delay: { label: "Aguardar", icon: Clock, color: "text-amber-400", bg: "border-amber-500/40 bg-amber-500/10", category: "action" },
    condition_email_opened: { label: "E-mail aberto?", icon: HelpCircle, color: "text-cyan-400", bg: "border-cyan-500/40 bg-cyan-500/10", category: "condition" },
    condition_email_replied: { label: "E-mail respondido?", icon: HelpCircle, color: "text-cyan-400", bg: "border-cyan-500/40 bg-cyan-500/10", category: "condition" },
    condition_whatsapp_replied: { label: "WhatsApp respondido?", icon: HelpCircle, color: "text-cyan-400", bg: "border-cyan-500/40 bg-cyan-500/10", category: "condition" },
    condition_call_answered: { label: "Ligação atendida?", icon: HelpCircle, color: "text-cyan-400", bg: "border-cyan-500/40 bg-cyan-500/10", category: "condition" },
    condition_score: { label: "Score ≥ X?", icon: HelpCircle, color: "text-cyan-400", bg: "border-cyan-500/40 bg-cyan-500/10", category: "condition" },
    end_success: { label: "Fim — Sucesso", icon: CheckCircle2, color: "text-blue-400", bg: "border-blue-500/40 bg-blue-500/10", category: "control" },
    end_no_contact: { label: "Fim — Sem Contato", icon: XCircle, color: "text-red-400", bg: "border-red-500/40 bg-red-500/10", category: "control" },
    end_optout: { label: "Fim — Opt-out", icon: XCircle, color: "text-slate-400", bg: "border-slate-500/40 bg-slate-500/10", category: "control" },
    escalate: { label: "Escalar Humano", icon: AlertTriangle, color: "text-amber-400", bg: "border-amber-500/40 bg-amber-500/10", category: "control" },
    schedule_meeting: { label: "Agendar Reunião", icon: CalendarCheck, color: "text-purple-400", bg: "border-purple-500/40 bg-purple-500/10", category: "control" },
};

// Custom Node Component
function CustomNode({ data, id }: { data: any; id: string }) {
    const nodeType = data.nodeType as string;
    const config = nodeTypeConfig[nodeType] || nodeTypeConfig.start;
    const Icon = config.icon;
    const isCondition = config.category === "condition";
    const isStart = nodeType === "start";
    const isEnd = nodeType.startsWith("end_");
    const hasContent = data.hasContent;
    const needsContent = ["email", "whatsapp", "phone"].includes(nodeType);
    const showWarning = needsContent && !hasContent;

    return (
        <div className={`relative px-4 py-3 rounded-xl border-2 shadow-lg min-w-[160px] max-w-[200px] ${config.bg} ${showWarning ? "!border-red-500/60 animate-pulse" : ""}`}>
            {/* Target handle (top) — all except start */}
            {!isStart && (
                <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-900" />
            )}

            <div className="flex items-center gap-2">
                <Icon size={16} className={config.color} />
                <span className="text-xs font-bold text-white truncate">{data.label}</span>
            </div>
            {showWarning && (
                <div className="mt-1 text-[10px] text-red-400 font-medium">⚠ Sem conteúdo</div>
            )}
            {isCondition && (
                <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">SIM</span>
                    <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">NÃO</span>
                </div>
            )}

            {/* Source handle (bottom) — all except end */}
            {!isEnd && !isCondition && (
                <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-900" />
            )}

            {/* Condition: two source handles (yes left, no right) */}
            {isCondition && (
                <>
                    <Handle type="source" position={Position.Bottom} id="yes" style={{ left: "30%" }} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-slate-900" />
                    <Handle type="source" position={Position.Bottom} id="no" style={{ left: "70%" }} className="!w-3 !h-3 !bg-red-400 !border-2 !border-slate-900" />
                </>
            )}
        </div>
    );
}

const nodeTypes = { custom: CustomNode };

function CadenceBuilderInner() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { getCadence, updateCadence, getPlaybook, getPersona } = useSDRStore();
    const cadence = getCadence(id);

    // Convert store nodes to React Flow format
    const initialNodes: Node[] = cadence?.nodes.map(n => ({
        id: n.id,
        type: "custom",
        position: n.position,
        data: { ...n.data, nodeType: n.type },
    })) || [];

    const initialEdges: Edge[] = cadence?.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        label: e.label,
        animated: true,
        style: { stroke: "#4ade80", strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4ade80" },
        labelStyle: { fill: "#94a3b8", fontWeight: 700, fontSize: 11 },
    })) || [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState<any>({});
    const nodeCounter = useRef(cadence?.nodes.length || 1);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const onConnect = useCallback((conn: Connection) => {
        setEdges(eds => addEdge({ ...conn, animated: true, style: { stroke: "#4ade80", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#4ade80" }, labelStyle: { fill: "#94a3b8", fontWeight: 700, fontSize: 11 } }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelectedNode(node.id);
        setEditorContent(node.data?.content || {});
    }, []);

    const addNode = useCallback((type: string, dropPosition?: { x: number; y: number }) => {
        nodeCounter.current += 1;
        const config = nodeTypeConfig[type];
        const position = dropPosition || { x: 250 + Math.random() * 100, y: nodes.length * 130 };
        const newNode: Node = {
            id: `n${nodeCounter.current}`,
            type: "custom",
            position,
            data: { label: config.label, nodeType: type, hasContent: false },
        };
        setNodes(ns => [...ns, newNode]);
    }, [nodes.length, setNodes]);

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback((event: DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("application/reactflow");
        if (!type) return;
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        addNode(type, position);
    }, [addNode, screenToFlowPosition]);

    const removeNode = useCallback((nodeId: string) => {
        setNodes(ns => ns.filter(n => n.id !== nodeId));
        setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
        if (selectedNode === nodeId) setSelectedNode(null);
    }, [selectedNode, setNodes, setEdges]);

    const handleSave = () => {
        if (!cadence) return;
        const storeNodes: CadenceNode[] = nodes.map(n => ({
            id: n.id,
            type: (n.data as any).nodeType,
            position: n.position,
            data: { label: (n.data as any).label, content: (n.data as any).content, hasContent: (n.data as any).hasContent },
        }));
        const storeEdges: CadenceEdge[] = edges.map(e => ({
            id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || undefined, label: e.label as string | undefined,
        }));
        updateCadence(id, { nodes: storeNodes, edges: storeEdges });
    };

    const handleActivate = () => {
        handleSave();
        updateCadence(id, { status: "active" });
        router.push("/dashboard/sdr/cadences");
    };

    if (!cadence) return <div className="p-10 text-center text-slate-400">Cadência não encontrada.</div>;

    const pb = getPlaybook(cadence.playbookId);
    const per = getPersona(cadence.personaId);
    const selNode = nodes.find(n => n.id === selectedNode);
    const selType = (selNode?.data as any)?.nodeType;

    return (
        <div className="h-screen flex flex-col bg-slate-950">
            {/* Top Bar */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard/sdr/cadences")} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                    <div>
                        <h1 className="text-sm font-bold text-white">{cadence.name}</h1>
                        <div className="text-[10px] text-slate-500">{pb?.name} · {per?.name} · {nodes.length} nodes</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"><Save size={14} /> Salvar</button>
                    <button onClick={handleActivate} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-colors shadow-lg shadow-blue-600/20"><Play size={14} /> Ativar</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Palette */}
                <div className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto custom-scrollbar">
                    <div className="p-4 space-y-4">
                        {[
                            { title: "Ações", items: ["email", "whatsapp", "phone", "delay"] },
                            { title: "Condições", items: ["condition_email_opened", "condition_email_replied", "condition_whatsapp_replied", "condition_call_answered", "condition_score"] },
                            { title: "Controle", items: ["end_success", "end_no_contact", "end_optout", "escalate", "schedule_meeting"] },
                        ].map(group => (
                            <div key={group.title}>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{group.title}</div>
                                <div className="space-y-1">
                                    {group.items.map(type => {
                                        const config = nodeTypeConfig[type];
                                        const Icon = config.icon;
                                        return (
                                            <div
                                                key={type}
                                                draggable
                                                onDragStart={(e) => { e.dataTransfer.setData("application/reactflow", type); e.dataTransfer.effectAllowed = "move"; }}
                                                onClick={() => addNode(type)}
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-800 text-left transition-all group cursor-grab active:cursor-grabbing"
                                            >
                                                <Icon size={14} className={config.color} />
                                                <span className="text-xs text-slate-300 group-hover:text-white">{config.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-950"
                        defaultEdgeOptions={{ animated: true }}
                    >
                        <Background color="#334155" gap={20} size={1.5} />
                        <Controls className="!bg-slate-800 !border-slate-700 !rounded-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700" />
                        <MiniMap
                            style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                            nodeColor={() => "#22c55e"}
                            maskColor="rgba(15, 23, 42, 0.8)"
                        />
                    </ReactFlow>
                </div>

                {/* Right Editor Panel */}
                <AnimatePresence>
                    {selectedNode && selNode && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 overflow-y-auto custom-scrollbar"
                        >
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">{(selNode.data as any).label}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => removeNode(selectedNode)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={14} /></button>
                                        <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"><X size={14} /></button>
                                    </div>
                                </div>

                                {/* Email Editor */}
                                {selType === "email" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Assunto</label>
                                            <input className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 focus:border-blue-500 outline-none" placeholder="Ex: {{nome}}, vi que a {{empresa}}..." value={editorContent.subject || ""} onChange={e => setEditorContent((c: any) => ({ ...c, subject: e.target.value }))} />
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {["{nome}", "{empresa}", "{segmento}", "{cargo}"].map(v => (
                                                <button key={v} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-mono hover:bg-blue-500/20 transition-colors">{v}</button>
                                            ))}
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Corpo do E-mail</label>
                                            <textarea className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 min-h-[150px] resize-none focus:border-blue-500 outline-none" placeholder="Escreva o corpo do e-mail..." value={editorContent.body || ""} onChange={e => setEditorContent((c: any) => ({ ...c, body: e.target.value }))} />
                                        </div>
                                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-400 font-bold hover:bg-purple-500/20 transition-colors">
                                            <Sparkles size={14} /> Gerar com IA
                                        </button>
                                        <button onClick={() => {
                                            setNodes(ns => ns.map(n => n.id === selectedNode ? { ...n, data: { ...n.data, content: editorContent, hasContent: true } } : n));
                                        }} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
                                            Salvar Conteúdo
                                        </button>
                                    </div>
                                )}

                                {/* WhatsApp Editor */}
                                {selType === "whatsapp" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Template Meta (primeiro contato)</label>
                                            <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 focus:border-blue-500 outline-none">
                                                <option value="">Selecionar template...</option>
                                                <option value="t1">Primeiro contato — Apresentação</option>
                                                <option value="t2">Follow-up — Interesse</option>
                                                <option value="t3">Agendamento — Reunião</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mensagem Livre</label>
                                            <textarea className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 min-h-[100px] resize-none focus:border-blue-500 outline-none" placeholder="Mensagem para janela de 24h aberta..." value={editorContent.message || ""} onChange={e => setEditorContent((c: any) => ({ ...c, message: e.target.value }))} />
                                        </div>
                                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-400 font-bold hover:bg-purple-500/20 transition-colors">
                                            <Sparkles size={14} /> Gerar com IA
                                        </button>
                                        <button onClick={() => {
                                            setNodes(ns => ns.map(n => n.id === selectedNode ? { ...n, data: { ...n.data, content: editorContent, hasContent: true } } : n));
                                        }} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
                                            Salvar Conteúdo
                                        </button>
                                    </div>
                                )}

                                {/* Phone Script Editor */}
                                {selType === "phone" && (
                                    <div className="space-y-3">
                                        {[
                                            { key: "opening", label: "1. Abertura", placeholder: "Olá {nome}, aqui é..." },
                                            { key: "hook", label: "2. Gancho", placeholder: "Vi que a {empresa}..." },
                                            { key: "pitch", label: "3. Pitch", placeholder: "Apresentação do produto..." },
                                            { key: "questions", label: "4. Qualificação", placeholder: "Perguntas BANT..." },
                                            { key: "scheduling", label: "5. Agendamento", placeholder: "Posso sugerir alguns horários?" },
                                            { key: "voicemail", label: "6. Voicemail", placeholder: "Mensagem para caixa postal..." },
                                        ].map(section => (
                                            <div key={section.key}>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">{section.label}</label>
                                                <textarea className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 min-h-[60px] resize-none focus:border-blue-500 outline-none" placeholder={section.placeholder} value={editorContent[section.key] || ""} onChange={e => setEditorContent((c: any) => ({ ...c, [section.key]: e.target.value }))} />
                                            </div>
                                        ))}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tom de Voz</label>
                                            <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 focus:border-blue-500 outline-none" value={editorContent.voiceTone || "female"} onChange={e => setEditorContent((c: any) => ({ ...c, voiceTone: e.target.value }))}>
                                                <option value="female">Feminino</option>
                                                <option value="male">Masculino</option>
                                            </select>
                                        </div>
                                        <button onClick={() => {
                                            setNodes(ns => ns.map(n => n.id === selectedNode ? { ...n, data: { ...n.data, content: editorContent, hasContent: true } } : n));
                                        }} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
                                            Salvar Script
                                        </button>
                                    </div>
                                )}

                                {/* Delay Editor */}
                                {selType === "delay" && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Dias</label>
                                                <input type="number" min={0} className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 focus:border-amber-500 outline-none" value={editorContent.days || 0} onChange={e => setEditorContent((c: any) => ({ ...c, days: parseInt(e.target.value) || 0 }))} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Horas</label>
                                                <input type="number" min={0} className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg w-full px-3 py-2 focus:border-amber-500 outline-none" value={editorContent.hours || 0} onChange={e => setEditorContent((c: any) => ({ ...c, hours: parseInt(e.target.value) || 0 }))} />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                            <input type="checkbox" className="rounded border-slate-600 bg-slate-800 text-blue-500" checked={editorContent.businessHours || false} onChange={e => setEditorContent((c: any) => ({ ...c, businessHours: e.target.checked }))} />
                                            Respeitar horário comercial
                                        </label>
                                        <button onClick={() => {
                                            const label = `Aguardar ${editorContent.days || 0}d ${editorContent.hours || 0}h`;
                                            setNodes(ns => ns.map(n => n.id === selectedNode ? { ...n, data: { ...n.data, label, content: editorContent, hasContent: true } } : n));
                                        }} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors">
                                            Salvar Delay
                                        </button>
                                    </div>
                                )}

                                {/* Info for condition/control nodes */}
                                {(["condition_email_opened", "condition_email_replied", "condition_whatsapp_replied", "condition_call_answered", "condition_score", "end_success", "end_no_contact", "end_optout", "escalate", "schedule_meeting", "start"].includes(selType)) && (
                                    <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                        <p className="text-xs text-slate-400">
                                            {selType?.startsWith("condition_") ? "Este node de condição divide o fluxo em dois caminhos: SIM e NÃO. Conecte as saídas aos próximos steps." :
                                                selType === "start" ? "Node de início do fluxo. Sempre obrigatório." :
                                                    selType === "escalate" ? "Sinaliza que o lead precisa de intervenção humana." :
                                                        selType === "schedule_meeting" ? "IA agenda reunião automaticamente com o lead." :
                                                            "Node de finalização da cadência."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function CadenceBuilderPage() {
    return (
        <ReactFlowProvider>
            <CadenceBuilderInner />
        </ReactFlowProvider>
    );
}
