"use client";

import { useAuthStore } from "@/stores/auth";
import { RefreshCw } from "lucide-react";
import { WhatsappInbox } from "@/components/whatsapp/WhatsappInbox";

export default function WhatsappPage() {
    const { user } = useAuthStore();

    if (!user) {
        return (
            <div className="h-full flex items-center justify-center flex-1">
                <RefreshCw size={24} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    return <WhatsappInbox />;
}
