"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Monitor,
    Users,
    Layers,
    Zap,
    Link2,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    GripVertical,
} from "lucide-react";
import { useId } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    type ParsedScope,
    type ParsedPlatform,
    type ParsedUser,
    type ParsedModule,
    type ParsedScreen,
    type ParsedFunctionality,
} from "../_shared";

// ─── Types ────────────────────────────────────

export interface ClientOption {
    id: string;
    name: string;
    company?: string;
}

// ─── Helpers ──────────────────────────────────

export function newFunctionality(): ParsedFunctionality {
    return { _id: crypto.randomUUID(), name: "Nova Funcionalidade", description: "", integration: undefined };
}
export function newScreen(): ParsedScreen {
    return { _id: crypto.randomUUID(), name: "Nova Tela", description: "", functionalities: [] };
}
export function newModule(): ParsedModule {
    return { _id: crypto.randomUUID(), name: "Novo Módulo", screens: [] };
}
export function newUser(): ParsedUser {
    return { _id: crypto.randomUUID(), name: "Novo Usuário", modules: [] };
}
export function newPlatform(): ParsedPlatform {
    return { _id: crypto.randomUUID(), name: "Nova Plataforma", users: [] };
}

/**
 * Serialises the structured ParsedScope back to a plain-text representation
 * that the AI can read in Step 3.
 */
export function scopeToText(scope: ParsedScope): string {
    const lines: string[] = [];
    for (const [pi, platform] of scope.entries()) {
        lines.push(`${pi + 1}. Plataforma: ${platform.name}`);
        for (const user of platform.users) {
            lines.push(`Usuário: ${user.name}`);
            for (const mod of user.modules) {
                lines.push(`Módulo: ${mod.name}`);
                for (const screen of mod.screens) {
                    lines.push(`Tela: ${screen.name}`);
                    if (screen.description) lines.push(`Descrição da tela: ${screen.description}`);
                    if (screen.functionalities.length > 0) lines.push(`Funcionalidades:`);
                    for (const func of screen.functionalities) {
                        lines.push(`Funcionalidade: ${func.name}`);
                        if (func.description) lines.push(`Descrição: ${func.description}`);
                        if (func.integration) lines.push(`Integração: ${func.integration}`);
                        if (func.hours !== undefined) lines.push(`Horas: ${func.hours}`);
                    }
                }
            }
        }
    }
    return lines.join("\n\n");
}

// ─── Inline text editor atom ──────────────────

export function InlineEdit({
    value,
    onSave,
    placeholder,
    multiline = false,
    className = "",
}: {
    value: string;
    onSave: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing) ref.current?.focus();
    }, [editing]);

    const commit = useCallback(() => {
        const trimmed = draft.trim();
        onSave(trimmed || value);
        setEditing(false);
    }, [draft, onSave, value]);

    const cancel = useCallback(() => {
        setDraft(value);
        setEditing(false);
    }, [value]);

    if (!editing) {
        return (
            <span
                className={`group/ie inline-flex items-center gap-1 cursor-pointer ${className}`}
                onClick={() => {
                    setDraft(value);
                    setEditing(true);
                }}
                title="Clique para editar"
            >
                {value || <span className="text-slate-600 italic">{placeholder ?? "..."}</span>}
                <Pencil
                    size={11}
                    className="opacity-0 group-hover/ie:opacity-60 text-slate-400 shrink-0 transition-opacity"
                />
            </span>
        );
    }

    const sharedProps = {
        ref: ref as never,
        value: draft,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setDraft(e.target.value),
        onKeyDown: (e: React.KeyboardEvent) => {
            if (!multiline && e.key === "Enter") { e.preventDefault(); commit(); }
            if (e.key === "Escape") cancel();
        },
        className:
            "bg-slate-900/80 border border-blue-500/40 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-blue-400 transition-colors min-w-[120px]",
        placeholder,
    };

    return (
        <span className="inline-flex items-center gap-1 flex-wrap">
            {multiline ? (
                <textarea {...sharedProps} rows={3} className={sharedProps.className + " w-full resize-none"} />
            ) : (
                <input {...sharedProps} type="text" />
            )}
            <button
                onClick={commit}
                className="p-1 rounded-md bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition-colors"
                title="Salvar"
            >
                <Check size={11} />
            </button>
            <button
                onClick={cancel}
                className="p-1 rounded-md bg-red-600/10 hover:bg-red-600/30 text-red-400 transition-colors"
                title="Cancelar"
            >
                <X size={11} />
            </button>
        </span>
    );
}

// ─── Drag and Drop Helpers ────────────────────

function SortableItem({ id, children, disabled }: { id: string; children: (dragHandleProps: any) => React.ReactNode; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? ("relative" as const) : ("static" as const),
    };
    return (
        <div ref={setNodeRef} style={style} className="relative group/sortable">
            {children({ ...attributes, ...listeners })}
        </div>
    );
}

export function SortableList<T extends { _id: string }>({
    items,
    onReorder,
    children,
    disabled = false,
}: {
    items: T[];
    onReorder: (items: T[]) => void;
    children: (item: T, index: number, dragHandleProps: any) => React.ReactNode;
    disabled?: boolean;
}) {
    const listId = useId();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i._id === active.id);
            const newIndex = items.findIndex((i) => i._id === over.id);
            onReorder(arrayMove(items, oldIndex, newIndex));
        }
    }

    return (
        <DndContext id={listId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                <div className={`space-y-3`}>
                    {items.map((item, index) => (
                        <SortableItem key={item._id} id={item._id} disabled={disabled}>
                            {(dragHandleProps) => children(item, index, dragHandleProps)}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

// ─── Collapsible section ──────────────────────

export function Collapsible({
    defaultOpen = true,
    header,
    children,
}: {
    defaultOpen?: boolean;
    header: React.ReactNode;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 w-full text-left group/col mb-1"
            >
                {open ? (
                    <ChevronDown size={12} className="text-slate-500 shrink-0" />
                ) : (
                    <ChevronRight size={12} className="text-slate-500 shrink-0" />
                )}
                {header}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Functionality editor ─────────────────────

export function FuncEditor({
    func,
    idx,
    onUpdate,
    onDelete,
    dragHandleProps,
}: {
    func: ParsedFunctionality;
    idx: number;
    onUpdate: (f: ParsedFunctionality) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}) {
    return (
        <div className="bg-slate-800/40 backdrop-blur-sm shadow-lg border border-white/[0.08] rounded-xl p-4 space-y-2 group/func transition-all hover:bg-slate-800/60">
            <div className="flex items-start gap-2">
                <div {...dragHandleProps} className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 cursor-grab active:cursor-grabbing hover:bg-violet-500/30 transition-colors group/grip" title="Arrastar">
                    <Zap size={10} className="text-violet-400 group-hover/grip:hidden" />
                    <GripVertical size={10} className="text-white hidden group-hover/grip:block" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">
                        Funcionalidade {idx + 1}
                    </p>
                    <InlineEdit
                        value={func.name}
                        onSave={(v) => onUpdate({ ...func, name: v })}
                        placeholder="Nome da funcionalidade"
                        className="text-sm font-semibold text-white leading-snug"
                    />
                </div>
                <button
                    onClick={onDelete}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 opacity-0 group-hover/func:opacity-100"
                    title="Remover funcionalidade"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* Description */}
            <div className="pl-7">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Descrição</p>
                <InlineEdit
                    value={func.description}
                    onSave={(v) => onUpdate({ ...func, description: v })}
                    placeholder="Descreva esta funcionalidade…"
                    multiline
                    className="text-xs text-slate-400 leading-relaxed"
                />
            </div>

            {/* Integration */}
            {func.integration !== undefined && (
                <div className="pl-7 flex items-start gap-1.5">
                    <Link2 size={10} className="text-cyan-500 mt-0.5 shrink-0" />
                    <InlineEdit
                        value={func.integration ?? ""}
                        onSave={(v) => onUpdate({ ...func, integration: v || undefined })}
                        placeholder="Integração…"
                        className="text-[11px] text-cyan-400"
                    />
                </div>
            )}
            {func.integration === undefined && (
                <button
                    onClick={() => onUpdate({ ...func, integration: "" })}
                    className="pl-7 flex items-center gap-1 text-[10px] text-slate-600 hover:text-cyan-400 transition-colors"
                >
                    <Plus size={9} />
                    Adicionar integração
                </button>
            )}

            {/* Hours */}
            <div className="pl-7 mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Horas Estimadas:</span>
                <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={func.hours ?? ""}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdate({ ...func, hours: isNaN(val) ? undefined : val });
                    }}
                    placeholder="Ex: 2.5"
                    className="w-20 bg-slate-900 border border-white/[0.08] rounded-md px-2 py-1 text-xs text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono"
                />
            </div>
        </div>
    );
}

// ─── Screen editor ────────────────────────────

export function ScreenEditor({
    screen,
    onUpdate,
    onDelete,
    dragHandleProps,
}: {
    screen: ParsedScreen;
    onUpdate: (s: ParsedScreen) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}) {
    const addFunc = () =>
        onUpdate({ ...screen, functionalities: [...screen.functionalities, newFunctionality()] });

    const updateFunc = (i: number, f: ParsedFunctionality) => {
        const funcs = [...screen.functionalities];
        funcs[i] = f;
        onUpdate({ ...screen, functionalities: funcs });
    };

    const deleteFunc = (i: number) =>
        onUpdate({
            ...screen,
            functionalities: screen.functionalities.filter((_, idx) => idx !== i),
        });

    const totalHours = screen.functionalities.reduce((sum, f) => sum + (f.hours || 0), 0);

    return (
        <div className="bg-slate-800/40 backdrop-blur-sm shadow-xl border border-white/[0.08] rounded-2xl overflow-hidden group/screen transition-all hover:border-white/[0.12]">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-white/[0.06]">
                <div {...dragHandleProps} className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing hover:bg-blue-500/30 transition-colors group/grip" title="Arrastar">
                    <Monitor size={13} className="text-blue-400 group-hover/grip:hidden" />
                    <GripVertical size={13} className="text-white hidden group-hover/grip:block" />
                </div>
                <InlineEdit
                    value={screen.name}
                    onSave={(v) => onUpdate({ ...screen, name: v })}
                    placeholder="Nome da tela"
                    className="text-xs font-bold text-blue-300 uppercase tracking-wider flex-1"
                />
                {totalHours > 0 && (
                    <div className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                        {totalHours}h
                    </div>
                )}
                <button
                    onClick={onDelete}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 opacity-0 group-hover/screen:opacity-100 ml-auto"
                    title="Remover tela"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">
                        Descrição da Tela
                    </p>
                    <InlineEdit
                        value={screen.description}
                        onSave={(v) => onUpdate({ ...screen, description: v })}
                        placeholder="Descreva o propósito desta tela…"
                        multiline
                        className="text-xs text-slate-400 leading-relaxed border-l-2 border-blue-500/30 pl-3 block w-full"
                    />
                </div>

                <Collapsible
                    defaultOpen
                    header={
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Funcionalidades ({screen.functionalities.length})
                        </p>
                    }
                >
                    <div className="mt-2">
                        <SortableList
                            items={screen.functionalities}
                            onReorder={(newArr) => onUpdate({ ...screen, functionalities: newArr })}
                        >
                            {(f, fi, handleProps) => (
                                <FuncEditor
                                    func={f}
                                    idx={fi}
                                    dragHandleProps={handleProps}
                                    onUpdate={(nf) => updateFunc(fi, nf)}
                                    onDelete={() => deleteFunc(fi)}
                                />
                            )}
                        </SortableList>
                        
                        <div className="pl-2 md:pl-6 mt-3">
                            <button
                                onClick={addFunc}
                                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-600/10 text-violet-400 hover:text-violet-300 hover:bg-violet-600/20 hover:border-violet-400 transition-all text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                            >
                                <Plus size={14} />
                                Nova Funcionalidade
                            </button>
                        </div>
                    </div>
                </Collapsible>
            </div>
        </div>
    );
}

// ─── Module editor ────────────────────────────

export function ModuleEditor({
    mod,
    onUpdate,
    onDelete,
    dragHandleProps,
}: {
    mod: ParsedModule;
    onUpdate: (m: ParsedModule) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}) {
    const addScreen = () =>
        onUpdate({ ...mod, screens: [...mod.screens, newScreen()] });

    const updateScreen = (i: number, s: ParsedScreen) => {
        const screens = [...mod.screens];
        screens[i] = s;
        onUpdate({ ...mod, screens });
    };

    const deleteScreen = (i: number) =>
        onUpdate({ ...mod, screens: mod.screens.filter((_, idx) => idx !== i) });

    const totalHours = mod.screens.reduce(
        (sum, s) => sum + s.functionalities.reduce((s2, f) => s2 + (f.hours || 0), 0), 0
    );

    return (
        <div className="space-y-3 group/mod">
            <div className="flex items-center gap-2">
                <div {...dragHandleProps} className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing hover:bg-amber-500/30 transition-colors group/grip" title="Arrastar">
                    <Layers size={13} className="text-amber-400 group-hover/grip:hidden" />
                    <GripVertical size={13} className="text-white hidden group-hover/grip:block" />
                </div>
                <InlineEdit
                    value={mod.name}
                    onSave={(v) => onUpdate({ ...mod, name: v })}
                    placeholder="Nome do módulo/menu"
                    className="text-xs font-bold text-amber-300 uppercase tracking-wider"
                />
                {totalHours > 0 && (
                    <div className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 shrink-0">
                        {totalHours}h
                    </div>
                )}
                <div className="flex-1 h-px bg-amber-500/10" />
                <button
                    onClick={onDelete}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/mod:opacity-100"
                    title="Remover módulo"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="pl-2 mt-3">
                <SortableList
                    items={mod.screens}
                    onReorder={(newArr) => onUpdate({ ...mod, screens: newArr })}
                >
                    {(s, si, handleProps) => (
                        <ScreenEditor
                            screen={s}
                            dragHandleProps={handleProps}
                            onUpdate={(ns) => updateScreen(si, ns)}
                            onDelete={() => deleteScreen(si)}
                        />
                    )}
                </SortableList>

                <div className="pl-2 md:pl-6 mt-3">
                    <button
                        onClick={addScreen}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-blue-500/30 bg-blue-600/10 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 hover:border-blue-400 transition-all text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    >
                        <Plus size={14} />
                        Nova Tela
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── User editor ──────────────────────────────

export function UserEditor({
    user,
    onUpdate,
    onDelete,
    dragHandleProps,
}: {
    user: ParsedUser;
    onUpdate: (u: ParsedUser) => void;
    onDelete: () => void;
    dragHandleProps?: any;
}) {
    const addModule = () =>
        onUpdate({ ...user, modules: [...user.modules, newModule()] });

    const updateModule = (i: number, m: ParsedModule) => {
        const mods = [...user.modules];
        mods[i] = m;
        onUpdate({ ...user, modules: mods });
    };

    const deleteModule = (i: number) =>
        onUpdate({ ...user, modules: user.modules.filter((_, idx) => idx !== i) });

    const totalHours = user.modules.reduce(
        (sum, m) => sum + m.screens.reduce((s2, s) => s2 + s.functionalities.reduce((s3, f) => s3 + (f.hours || 0), 0), 0), 0
    );

    return (
        <div className="space-y-4 group/user">
            <div className="flex items-center gap-2">
                <div {...dragHandleProps} className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing hover:bg-green-500/30 transition-colors group/grip" title="Arrastar">
                    <Users size={11} className="text-green-400 group-hover/grip:hidden" />
                    <GripVertical size={11} className="text-white hidden group-hover/grip:block" />
                </div>
                <InlineEdit
                    value={user.name}
                    onSave={(v) => onUpdate({ ...user, name: v })}
                    placeholder="Nome do usuário"
                    className="text-sm font-bold text-green-300"
                />
                {totalHours > 0 && (
                    <div className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 shrink-0">
                        {totalHours}h
                    </div>
                )}
                <div className="flex-1 h-px bg-green-500/10" />
                <button
                    onClick={onDelete}
                    className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/user:opacity-100"
                    title="Remover usuário"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            <div className="pl-4 space-y-5">
                {user.modules.map((m, mi) => (
                    <ModuleEditor
                        key={mi}
                        mod={m}
                        onUpdate={(nm) => updateModule(mi, nm)}
                        onDelete={() => deleteModule(mi)}
                    />
                ))}
                <button
                    onClick={addModule}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/10 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                >
                    <Plus size={14} />
                    Novo Módulo / Menu
                </button>
            </div>
        </div>
    );
}

// ─── Platform editor ──────────────────────────

export function PlatformEditor({
    platform,
    onUpdate,
    onDelete,
    canDelete,
    dragHandleProps,
}: {
    platform: ParsedPlatform;
    onUpdate: (p: ParsedPlatform) => void;
    onDelete: () => void;
    canDelete: boolean;
    dragHandleProps?: any;
}) {
    const addUser = () =>
        onUpdate({ ...platform, users: [...platform.users, newUser()] });

    const updateUser = (i: number, u: ParsedUser) => {
        const users = [...platform.users];
        users[i] = u;
        onUpdate({ ...platform, users });
    };

    const deleteUser = (i: number) =>
        onUpdate({ ...platform, users: platform.users.filter((_, idx) => idx !== i) });

    const totalHours = platform.users.reduce(
        (sum, u) => sum + u.modules.reduce((s2, m) => s2 + m.screens.reduce((s3, s) => s3 + s.functionalities.reduce((s4, f) => s4 + (f.hours || 0), 0), 0), 0), 0
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06] group/platform">
                <div {...dragHandleProps} className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing hover:bg-blue-500/30 transition-colors group/grip" title="Arrastar">
                    <Monitor size={15} className="text-blue-400 group-hover/grip:hidden" />
                    <GripVertical size={15} className="text-white hidden group-hover/grip:block" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        Plataforma
                        {totalHours > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white shrink-0">
                                Total Estimado: {totalHours}h
                            </span>
                        )}
                    </p>
                    <InlineEdit
                        value={platform.name}
                        onSave={(v) => onUpdate({ ...platform, name: v })}
                        placeholder="Ex: Aplicativo Web, Mobile…"
                        className="text-base font-bold text-white"
                    />
                </div>
                {canDelete && (
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/platform:opacity-100"
                        title="Remover plataforma"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <SortableList
                    items={platform.users}
                    onReorder={(newArr) => onUpdate({ ...platform, users: newArr })}
                >
                    {(u, ui, handleProps) => (
                        <UserEditor
                            user={u}
                            dragHandleProps={handleProps}
                            onUpdate={(nu) => updateUser(ui, nu)}
                            onDelete={() => deleteUser(ui)}
                        />
                    )}
                </SortableList>
                
                <div className="pl-2 md:pl-6">
                    <button
                        onClick={addUser}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-green-500/30 bg-green-500/10 text-green-400 hover:text-green-300 hover:bg-green-500/20 hover:border-green-400 transition-all text-xs font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    >
                        <Plus size={14} />
                        Novo Perfil de Usuário
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Summary bar ─────────────────────────────

export function SummaryBar({
    scope,
    title,
    clientId,
    clients,
}: {
    scope: ParsedScope;
    title: string;
    clientId: string | null;
    clients: ClientOption[];
}) {
    const client = clients.find((c) => c.id === clientId);
    const totalScreens = scope.flatMap((p) =>
        p.users.flatMap((u) => u.modules.flatMap((m) => m.screens)),
    ).length;
    const totalFuncs = scope.flatMap((p) =>
        p.users.flatMap((u) =>
            u.modules.flatMap((m) => m.screens.flatMap((s) => s.functionalities)),
        ),
    ).length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
                { label: "Proposta", value: title || "—" },
                { label: "Cliente", value: client ? client.name : "Sem cliente" },
                { label: "Telas", value: String(totalScreens) },
                { label: "Funcionalidades", value: String(totalFuncs) },
            ].map((item) => (
                <div
                    key={item.label}
                    className="bg-slate-800/40 backdrop-blur-sm shadow-md border border-white/[0.08] rounded-xl p-4 transition-all hover:bg-slate-800/60"
                >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {item.label}
                    </p>
                    <p className="text-sm font-bold text-white truncate">{item.value}</p>
                </div>
            ))}
        </div>
    );
}
