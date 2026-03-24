"use client";

import Sidebar from "@/components/dashboard/Sidebar";
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
                    {/* Background */}
                    <div className="fixed inset-0 z-0">
                        <div className="absolute inset-0 bg-slate-900"></div>
                        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.5)]"></div>
                    </div>

                    <MatrixRain />

                    <div className="relative z-50">
                        <Sidebar />
                    </div>

                    <main className="relative z-10 flex-1 transition-all md:ml-[280px] h-screen overflow-y-auto custom-scrollbar pt-16 md:pt-0">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </ToastProvider>
    );
}
