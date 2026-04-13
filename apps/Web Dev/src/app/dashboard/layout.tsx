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
                    {/* Matrix Digital Rain Animation */}
                    <MatrixRain />

                    {/* Sidebar with higher z-index to stay above background */}
                    <div className="relative z-50">
                        <Sidebar />
                    </div>

                    {/* Main Content Area */}
                    <main className="relative z-10 flex-1 transition-all md:ml-[280px] h-screen overflow-y-auto custom-scrollbar pt-16 md:pt-0">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </ToastProvider>
    );
}
