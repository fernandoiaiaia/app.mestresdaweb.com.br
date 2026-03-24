"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Image from "next/image";
import MatrixRain from "@/components/shared/MatrixRain";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <AuthGuard>
                <div className="relative min-h-screen text-white flex overflow-hidden bg-slate-900">
                    {/* Background Image Setup */}
                    <div className="fixed inset-0 z-0">
                        <Image
                            src="/branding/ai-bg.png"
                            alt="Background"
                            fill
                            className="object-cover opacity-15"
                            priority
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/60 mix-blend-multiply"></div>
                        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
                    </div>

                    {/* Matrix Digital Rain Animation */}
                    <MatrixRain />

                    {/* Sidebar — already fixed z-50 internally */}
                    <Sidebar />

                    {/* Main Content Area */}
                    <main className="relative flex-1 transition-all md:ml-[280px] h-screen overflow-y-auto custom-scrollbar">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </ToastProvider>
    );
}
