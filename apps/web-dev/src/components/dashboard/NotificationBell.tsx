"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 bottom-full mb-2 w-[340px] bg-slate-800/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                                <h3 className="text-sm font-bold text-white">Notificações</h3>
                                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-slate-700/30">
                                {MOCK_NOTIFICATIONS.slice(0, 6).map(n => (
                                    <Link
                                        key={n.id}
                                        href={n.link}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors ${!n.read ? 'bg-blue-600/5' : ''}`}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-green-500' : 'bg-slate-600'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold leading-tight ${!n.read ? 'text-white' : 'text-slate-300'}`}>{n.title}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.description}</p>
                                        </div>
                                        <ExternalLink size={12} className="text-slate-600 shrink-0 mt-1" />
                                    </Link>
                                ))}
                            </div>

                            <div className="px-4 py-2.5 border-t border-white/[0.06]">
                                <Link
                                    href="/dashboard/notifications"
                                    onClick={() => setOpen(false)}
                                    className="text-[11px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                                >
                                    Ver todas as notificações
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
