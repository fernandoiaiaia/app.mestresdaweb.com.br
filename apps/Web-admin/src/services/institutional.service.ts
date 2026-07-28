import { api } from "@/lib/api";

export type Partner = {
    id: string;
    name: string;
    cpf: string;
    role: string;
    share: string;
    companyId?: string;
};

export type InstitutionalProfile = {
    id?: string;
    companyName?: string;
    tradeName?: string;
    cnpj?: string;
    stateRegistration?: string;
    municipalRegistration?: string;
    cnae?: string;
    taxRegime?: string;
    email?: string;
    phone?: string;
    website?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    partners?: Partner[];
    certFilename?: string;
    certPassword?: string;
    certExpiration?: string;
};

export const institutionalService = {
    async get() {
        return api<InstitutionalProfile>("/api/institutional");
    },

    async update(data: Partial<InstitutionalProfile>) {
        return api<InstitutionalProfile>("/api/institutional", {
            method: "PUT",
            body: data,
        });
    },

    async uploadCertificate(file: File, password?: string) {
        const formData = new FormData();
        formData.append("certificate", file);
        if (password) {
            formData.append("password", password);
        }

        const token = localStorage.getItem("accessToken");
        const headers: Record<string, string> = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/institutional/certificate`, {
                method: "POST",
                headers,
                body: formData,
            });

            const data = await res.json();
            return data as { success: boolean; data?: InstitutionalProfile; message?: string };
        } catch (error: any) {
            return { success: false, message: error.message || "Erro ao enviar certificado" };
        }
    }
};
