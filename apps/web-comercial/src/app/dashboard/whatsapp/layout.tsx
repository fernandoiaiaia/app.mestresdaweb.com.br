"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, LayoutDashboard, Trello, Tags } from "lucide-react";
import { ReactNode } from "react";

export default function WhatsappLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="h-screen flex overflow-hidden relative">
            {/* MINI SIDEBAR NAV */}
            <div className="w-16 bg-slate-950/10 backdrop-blur-sm border-r border-white/5 flex flex-col items-center py-6 gap-6 z-20 shrink-0">
                <Link 
                    href="/dashboard/whatsapp/dashboard"
                    title="Dashboard"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${pathname === "/dashboard/whatsapp/dashboard" ? "bg-blue-500/20 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                >
                    <LayoutDashboard size={20} />
                </Link>
                <Link 
                    href="/dashboard/whatsapp/kanban"
                    title="Kanban (Pipeline)"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${pathname === "/dashboard/whatsapp/kanban" ? "bg-blue-500/20 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                >
                    <Trello size={20} />
                </Link>
                <Link 
                    href="/dashboard/whatsapp"
                    title="Inbox"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${pathname === "/dashboard/whatsapp" ? "bg-blue-500/20 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                >
                    <MessageSquare size={20} />
                </Link>
                <div className="flex-1" />
                <Link 
                    href="/dashboard/whatsapp/labels"
                    title="Etiquetas"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${pathname === "/dashboard/whatsapp/labels" ? "bg-blue-500/20 text-blue-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}
                >
                    <Tags size={20} />
                </Link>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden">
                {children}
            </div>
        </div>
    );
}
