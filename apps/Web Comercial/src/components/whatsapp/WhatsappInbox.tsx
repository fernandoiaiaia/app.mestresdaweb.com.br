"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, MoreVertical, Paperclip, Smile, Send,
    Phone, Video, Info, Lock, ArrowLeft,
    Check, CheckCheck, Clock, ShieldAlert,
    UserCircle, RefreshCw, X, Bell, PanelRight, Plus
} from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";

export function WhatsappInbox() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    
    // Server State
    const [chats, setChats] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    // UI State
    const [messageInput, setMessageInput] = useState("");
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showLeadDetails, setShowLeadDetails] = useState(true);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedChat) {
            scrollToBottom();
        }
    }, [selectedChat, messages]);

    // Initial Fetch (Conversations + Labels)
    useEffect(() => {
        if (!user) return;
        const isClient = user.role === "VIEWER";
        if (isClient) {
            router.push("/dashboard");
            return;
        }

        const fetchInit = async () => {
            try {
                // Pre-init target conversation if arriving via Kanban redirect
                const urlParams = new URLSearchParams(window.location.search);
                const autoPhone = urlParams.get('phone');
                const autoName = urlParams.get('name') || "Lead Kanban";

                if (autoPhone) {
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/conversations/init`, {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
                            },
                            body: JSON.stringify({ phone: autoPhone, name: autoName })
                        });
                    } catch (e) {
                        console.error("Failed to auto-init chat", e);
                    }
                }

                const [chatsRes, labelsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/conversations`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/labels`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
                    })
                ]);
                
                if (chatsRes.ok) {
                    const data = await chatsRes.json();
                    const chatsArr = data.data || [];
                    console.log("[WA Inbox] Loaded chats:", chatsArr.length, chatsArr);
                    setChats(chatsArr);
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const autoPhone = urlParams.get('phone');
                    if (autoPhone) {
                        const cleanedSearch = autoPhone.replace(/\D/g, '');
                        // allow match if substring or exact match of numeric phone
                        const target = chatsArr.find((c:any) => {
                            const cleanedChatPhone = (c.phone || "").replace(/\D/g, '');
                            return cleanedChatPhone && (cleanedChatPhone.includes(cleanedSearch) || cleanedSearch.includes(cleanedChatPhone));
                        });
                        if (target) setSelectedChat(target);
                    }
                } else {
                    console.error("[WA Inbox] Failed to fetch chats:", chatsRes.status, await chatsRes.text());
                }
                if (labelsRes.ok) {
                    const data = await labelsRes.json();
                    setAvailableTags(data.data || []);
                }
                setLoading(false);
            } catch (err) {
                console.error("Init WhatsApp err", err);
                setLoading(false);
            }
        };

        fetchInit();
    }, [user, router]);

    // Load Messages when chat selected
    useEffect(() => {
        if (!selectedChat) return;

        const loadMessages = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/conversations/${selectedChat.id}/messages`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.data || []);
                    
                    // Mark as read in local list
                    setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unread: 0 } : c));
                }
            } catch (err) {
                console.error("Error loading messages", err);
            }
        };

        loadMessages();
    }, [selectedChat?.id]);

    // SSE Real-Time Listener
    useEffect(() => {
        if (!user) return;
        
        const token = localStorage.getItem("accessToken");
        // Simple SSE polyfill or proxy via manual fetch chunking, 
        // since standard EventSource doesn't officially support Authorization headers out-of-the-box easily without cookies.
        // For standard EventSource, query param is often used: 
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/sse?token=${token}`;
        
        // Alternatively (Standard HTML5): Requires cookies or token as query string
        const sse = new EventSource(url, { withCredentials: false }); // Needs standard configuration
        // ... omitted rigorous fallback to avoid bloat, assuming SSE works smoothly

        sse.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === "NEW_MESSAGE") {
                    const newMsg = parsed.data.message;
                    const convInfo = parsed.data.conversation;

                    // playNotificationSound(); (Implementation skipped here for brevity)

                    // Update Chats List
                    setChats(prev => {
                        const existing = prev.find(c => c.id === convInfo.id);
                        const mappedConv = {
                            id: convInfo.id,
                            contactId: convInfo.contact.id,
                            name: convInfo.contact.profileName || convInfo.contact.phone,
                            phone: convInfo.contact.phone,
                            lastMessage: convInfo.lastMessageSnippet || "",
                            time: new Date(convInfo.lastMessageAt).toISOString(),
                            unread: convInfo.unreadCount,
                            tags: convInfo.contact?.labels ? convInfo.contact.labels.map((l: any) => l.label) : []
                        };

                        if (!existing) return [mappedConv, ...prev]; // prepend
                        return prev.map(c => c.id === convInfo.id ? mappedConv : c).sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); // update and re-sort
                    });

                    // Update open window if active
                    if (selectedChat?.id === convInfo.id) {
                        setMessages(prev => [...prev, {
                            id: newMsg.id,
                            text: newMsg.content || "",
                            time: new Date(newMsg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                            isMe: newMsg.direction === "outbound",
                            status: newMsg.status
                        }]);
                        
                        // Because we are looking at it, zero out the unread. (Backend needs a hook or rely on user clicking away to reload)
                        setChats(prev => prev.map(c => c.id === convInfo.id ? { ...c, unread: 0 } : c));
                    }
                }
            } catch (e) {
                // ignore keep-alive pings
            }
        };

        return () => {
            sse.close();
        };
    }, [user, selectedChat?.id]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat) return;
        
        const txt = messageInput.trim();
        setMessageInput(""); // Optimistic clear

        // Optimistic UI push
        const optimisticId = `opt_${Date.now()}`;
        setMessages(prev => [...prev, {
            id: optimisticId,
            text: txt,
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            status: "sending..."
        }]);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/conversations/${selectedChat.id}/send`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
                },
                body: JSON.stringify({ text: txt, type: "text" })
            });
            
            if (res.ok) {
                const data = await res.json();
                
                // Replace optimistic with real
                setMessages(prev => prev.map(m => m.id === optimisticId ? data.data : m));

                // Bump in list
                setChats(prev => prev.map(c => c.id === selectedChat.id ? { 
                    ...c, 
                    lastMessage: txt.substring(0, 50),
                    time: new Date().toISOString()
                } : c).sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
            } else {
                 setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: "failed" } : m));
            }
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: "failed" } : m));
        }
    };
    
    // Label Updater
    const toggleLabel = async (tagId: string, isActive: boolean) => {
        if (!selectedChat) return;

        const currentTagIds = selectedChat.tags?.map((t: any) => t.id) || [];
        const newLabelIds = isActive ? currentTagIds.filter((id: string) => id !== tagId) : [...currentTagIds, tagId];
        
        // Optimistic UI updates
        const mappedNewTags = availableTags.filter(at => newLabelIds.includes(at.id));
        const updatedChat = { ...selectedChat, tags: mappedNewTags };
        setSelectedChat(updatedChat);
        setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));

        // Background sync
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}/api/whatsapp/conversations/${selectedChat.id}/labels`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}` 
            },
            body: JSON.stringify({ labels: newLabelIds })
        });
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-900/60 flex-1 border-l border-white/5">
                <RefreshCw size={24} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-1 overflow-hidden relative">
            
            {/* ═══ SIDEBAR: CHAT LIST ═══ */}
            <div className={`w-full md:w-[320px] bg-slate-900/30 backdrop-blur-sm border-r border-white/5 flex flex-col shrink-0 transition-all ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Header */}
                <div className="h-16 px-4 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between shrink-0 mb-px">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                            {user?.avatar ? (
                                <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777"}${user.avatar}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={28} className="text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white leading-tight">Meus Atendimentos</h2>
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span> Online</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-white/5">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar conversa..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/[0.06] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {chats.length === 0 && <div className="text-center p-6 text-slate-500 text-xs">Nenhuma conversa encontrada.</div>}
                    {chats.map((chat) => (
                        <div 
                            key={chat.id} 
                            onClick={() => setSelectedChat(chat)}
                            className={`flex items-center gap-3 p-3 cursor-pointer border-b border-white/[0.03] transition-colors ${selectedChat?.id === chat.id ? 'bg-[#2a3942]' : 'hover:bg-slate-800'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xl font-bold text-slate-400 overflow-hidden">
                                {chat.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-semibold text-white truncate pr-2">{chat.name}</h3>
                                    <span className={`text-[10px] shrink-0 ${chat.unread > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                        {new Date(chat.time).toLocaleTimeString('pt-br', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                                        {chat.lastMessage}
                                    </p>
                                </div>
                                {chat.tags && chat.tags.length > 0 && (
                                    <div className="flex gap-1 overflow-x-hidden">
                                        {chat.tags.map((tag: any) => (
                                            <span key={tag.name} className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0 leading-none ${tag.color}`}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {chat.unread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-[#111b21]">{chat.unread}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ MAIN: CHAT AREA ═══ */}
            <div className={`flex-1 flex flex-col bg-slate-900/30 relative ${!selectedChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                {!selectedChat ? (
                    <div className="text-center p-8 max-w-md">
                        <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-6">
                            <Lock size={40} className="text-slate-600" />
                        </div>
                        <h2 className="text-2xl font-light text-slate-300 mb-4">Mestres da Web whats</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Envie e receba mensagens pela API Oficial Cloud da Meta. Suas conversas com clientes são privadas.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-4 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between border-b border-white/5 shrink-0 z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden w-8 h-8 -ml-2 rounded-full flex items-center justify-center text-slate-400 hover:bg-white/5">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-400 shrink-0 cursor-pointer overflow-hidden">
                                    {selectedChat.name.charAt(0)}
                                </div>
                                <div className="cursor-pointer">
                                    <h2 className="text-sm font-bold text-white">{selectedChat.name}</h2>
                                    <p className="text-xs text-slate-400">{selectedChat.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setShowLeadDetails(!showLeadDetails)} 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showLeadDetails ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                    title="Alternar Detalhes do Lead"
                                >
                                    <PanelRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Background / Messages area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 relative custom-scrollbar flex flex-col">
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')" }}></div>
                            
                            <div className="flex-1"></div>

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} w-full relative z-10`}>
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-xl px-3 pt-2 pb-1.5 shadow-sm relative ${
                                        msg.isMe 
                                            ? 'bg-[#005c4b] text-white rounded-tr-none' 
                                            : 'bg-slate-800/80 text-white rounded-tl-none'
                                    }`}>
                                        <p className="text-[14px] leading-snug whitespace-pre-wrap">{msg.text}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
                                            <span className="text-[10px] text-white/60">{msg.time}</span>
                                            {msg.isMe && (
                                                <CheckCheck size={14} className={msg.status === "read" ? "text-[#53bdeb]" : "text-white/60"} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-slate-900/30 backdrop-blur-sm px-4 py-3 flex items-end gap-3 z-10 shrink-0">
                            <button className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-300 transition-colors">
                                <Smile size={24} strokeWidth={1.5} />
                            </button>
                            
                            <div className="flex-1 bg-[#2a3942] rounded-xl overflow-hidden shadow-inner">
                                <textarea 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Digite uma mensagem"
                                    className="w-full bg-transparent text-white placeholder:text-slate-400 px-4 py-3 text-sm focus:outline-none resize-none min-h-[44px] max-h-32 custom-scrollbar"
                                    style={{ height: "44px" }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                            </div>

                            <button onClick={handleSendMessage} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#00a884] hover:bg-white/5 transition-colors cursor-pointer" title="Enviar Mensagem">
                                <Send size={20} className="ml-1" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ═══ RIGHT PANEL: CRM LEAD DETAILS ═══ */}
            <AnimatePresence>
                {selectedChat && showLeadDetails && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ ease: "easeInOut", duration: 0.2 }}
                        className="bg-slate-900/80 backdrop-blur-sm border-l border-white/5 flex-col hidden lg:flex shrink-0 overflow-hidden"
                    >
                        <div className="w-[300px] h-full flex flex-col">
                            <div className="h-16 px-4 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between shrink-0 border-b border-white/10">
                                <h2 className="text-sm font-bold text-[#e9edef]">Detalhes do Contato</h2>
                                <button onClick={() => setShowLeadDetails(false)} className="text-slate-400 hover:text-white transition-colors" title="Fechar Detalhes">
                                    <X size={18} />
                                </button>
                            </div>
                    
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                                {/* Lead Contact */}
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                                        {selectedChat.name.charAt(0)}
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{selectedChat.name}</h3>
                                    <p className="text-sm text-slate-400 mb-4">{selectedChat.phone}</p>

                                    {selectedChat.linkedEntity && (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                                {selectedChat.linkedEntity.type === "client" ? "Cliente CRM" : "Lead CRM"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* ═══ Oportunidades / Deals ═══ */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Oportunidades</h4>
                                        <button 
                                            onClick={() => router.push(`/dashboard/crm/opportunities/new?name=${encodeURIComponent(selectedChat.name)}&phone=${encodeURIComponent(selectedChat.phone)}`)}
                                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Nova
                                        </button>
                                    </div>

                                    {selectedChat.deals && selectedChat.deals.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedChat.deals.map((deal: any) => {
                                                const tempColors: Record<string, string> = {
                                                    hot: "bg-red-500/20 text-red-400 border-red-500/30",
                                                    warm: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                                                    cold: "bg-sky-500/20 text-sky-400 border-sky-500/30"
                                                };
                                                const statusIcons: Record<string, string> = {
                                                    open: "🟢",
                                                    won: "🏆",
                                                    lost: "❌"
                                                };
                                                return (
                                                    <div 
                                                        key={deal.id}
                                                        onClick={() => router.push(`/dashboard/crm/pipeline/${deal.id}`)}
                                                        className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                                            <h5 className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{deal.title}</h5>
                                                            <span className="text-[10px] shrink-0">{statusIcons[deal.status] || "⚪"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="text-[11px] font-bold text-emerald-400">
                                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(deal.value)}
                                                            </span>
                                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${tempColors[deal.temperature] || tempColors.cold}`}>
                                                                {deal.temperature}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                            <span className="truncate">{deal.funnel}</span>
                                                            <span>→</span>
                                                            <span className="truncate font-medium text-slate-400">{deal.stage}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600 italic">Nenhuma oportunidade vinculada.</p>
                                    )}
                                </div>

                                {/* Labels / Etiquetas */}
                                <div className="relative">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Etiquetas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedChat.tags?.map((tag: any) => (
                                            <span key={tag.name} className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border text-white/90 shadow-sm ${tag.color || "bg-slate-600 border-transparent"}`}>
                                                {tag.name}
                                            </span>
                                        ))}
                                        <button 
                                            onClick={() => setShowTagSelector(!showTagSelector)}
                                            className="px-2.5 py-1 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-bold rounded-md border border-white/10 flex items-center gap-1 transition-colors shrink-0"
                                            title="Trocar Etiquetas"
                                        >
                                            <span className="text-xl leading-none -mt-0.5">+</span> Editar
                                        </button>
                                    </div>

                                    {/* Tag Selector Popover */}
                                    <AnimatePresence>
                                        {showTagSelector && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute top-12 left-0 w-full bg-[#1e2a30] border border-white/10 rounded-xl shadow-2xl z-50 p-3"
                                            >
                                                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                                    <span className="text-xs font-bold text-white">Editar Etiquetas</span>
                                                    <button onClick={() => setShowTagSelector(false)} className="text-slate-400 hover:text-white" title="Fechar"><X size={14} /></button>
                                                </div>
                                                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                                    {availableTags.map(tag => {
                                                        const isActive = selectedChat.tags?.some((t: any) => t.id === tag.id);
                                                        return (
                                                            <div 
                                                                key={tag.id} 
                                                                onClick={() => toggleLabel(tag.id, isActive)}
                                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-colors ${isActive ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/[0.02]'}`}
                                                            >
                                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border text-white/90 ${tag.color || "bg-slate-600 border-none"}`}>
                                                                    {tag.name}
                                                                </span>
                                                                {isActive && <Check size={14} className="text-[#00a884]" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
