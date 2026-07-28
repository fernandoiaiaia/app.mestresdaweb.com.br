"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Image from "next/image";
import MatrixRain from "@/components/shared/MatrixRain";
import { AuthGuard } from "@/components/providers/AuthGuard";
import ProductTour from "@/components/dashboard/ProductTour";
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
                    
                    {/* First Login Product Tour & Welcome Screen */}
                    <ProductTour />

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
