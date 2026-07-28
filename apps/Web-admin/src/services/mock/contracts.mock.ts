// Mock Data Service for Contracts Module

// Types
export type ContractStatus = 'draft' | 'review' | 'sent' | 'signing' | 'signed' | 'cancelled' | 'archived';
export type ContractTemplateStatus = 'active' | 'inactive';

export interface ContractTemplate {
    id: string;
    name: string;
    description: string;
    content: string;
    status: ContractTemplateStatus;
    createdAt: string;
    updatedAt: string;
}

export interface Contract {
    id: string;
    number: string;
    contractorName: string;
    contractorDocument: string;
    objectDescription: string;
    value: number;
    paymentMethod: string;
    status: ContractStatus;
    createdAt: string;
    signingDeadline: string;
    templateId: string;
    signers: ContractSigner[];
}

export interface ContractSigner {
    id: string;
    name: string;
    email: string;
    role: 'contratante' | 'contratada' | 'testemunha';
    status: 'pending' | 'signed';
    signedAt?: string;
}

// Initial Mock Data
let templates: ContractTemplate[] = [
    {
        id: 'tpl_1',
        name: 'Prestação de Serviços de Desenvolvimento',
        description: 'Modelo padrão para desenvolvimento de software sob demanda.',
        content: '<p>Pelo presente instrumento, as partes celebram o seguinte contrato de prestação de serviços...</p><p><b>Objeto:</b> {{objeto}}</p><p><b>Valor:</b> {{valor}}</p>',
        status: 'active',
        createdAt: '2026-05-10T10:00:00Z',
        updatedAt: '2026-05-15T14:30:00Z'
    },
    {
        id: 'tpl_2',
        name: 'Licenciamento de Software (SaaS)',
        description: 'Termos de uso e licenciamento padrão SaaS.',
        content: '<p>Este contrato rege o uso do software fornecido pela contratada...</p>',
        status: 'active',
        createdAt: '2026-05-12T09:00:00Z',
        updatedAt: '2026-05-12T09:00:00Z'
    }
];

let contracts: Contract[] = [
    {
        id: 'ctr_1001',
        number: '2026.001',
        contractorName: 'Tech Inovações Ltda',
        contractorDocument: '12.345.678/0001-99',
        objectDescription: 'Desenvolvimento do aplicativo mobile iOS e Android',
        value: 150000,
        paymentMethod: 'PIX',
        status: 'signing',
        createdAt: '2026-05-20T14:00:00Z',
        signingDeadline: '2026-05-25T23:59:59Z',
        templateId: 'tpl_1',
        signers: [
            { id: 's1', name: 'João Tech', email: 'joao@tech.com', role: 'contratante', status: 'pending' },
            { id: 's2', name: 'Maria Dev', email: 'maria@empresa.com', role: 'contratada', status: 'signed', signedAt: '2026-05-21T11:00:00Z' }
        ]
    },
    {
        id: 'ctr_1002',
        number: '2026.002',
        contractorName: 'Comércio Rápido S.A.',
        contractorDocument: '98.765.432/0001-11',
        objectDescription: 'Licença anual do ERP',
        value: 12000,
        paymentMethod: 'Boleto',
        status: 'signing',
        createdAt: '2026-06-01T09:00:00Z',
        signingDeadline: '2026-06-10T23:59:59Z',
        templateId: 'tpl_2',
        signers: [
            { id: 's3', name: 'Carlos Rápido', email: 'carlos@comercio.com', role: 'contratante', status: 'pending' },
            { id: 's4', name: 'Maria Dev', email: 'maria@empresa.com', role: 'contratada', status: 'signed', signedAt: '2026-06-02T15:00:00Z' }
        ]
    }
];

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const contractsMockService = {
    // Templates
    async getTemplates() {
        await delay(500);
        return { success: true, data: [...templates] };
    },
    async getTemplateById(id: string) {
        await delay(300);
        const tpl = templates.find(t => t.id === id);
        if (!tpl) return { success: false, message: 'Modelo não encontrado' };
        return { success: true, data: { ...tpl } };
    },
    async saveTemplate(data: Partial<ContractTemplate>) {
        await delay(800);
        if (data.id) {
            templates = templates.map(t => t.id === data.id ? { ...t, ...data, updatedAt: new Date().toISOString() } as ContractTemplate : t);
        } else {
            const newTpl: ContractTemplate = {
                id: `tpl_${Date.now()}`,
                name: data.name || 'Novo Modelo',
                description: data.description || '',
                content: data.content || '',
                status: data.status || 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            templates.push(newTpl);
        }
        return { success: true };
    },

    // Contracts
    async getContracts(params?: { page?: number; limit?: number; search?: string }) {
        await delay(600);
        
        let filtered = [...contracts];
        if (params?.search) {
            const search = params.search.toLowerCase();
            filtered = filtered.filter(c => 
                c.contractorName.toLowerCase().includes(search) ||
                c.number.includes(search) ||
                c.objectDescription.toLowerCase().includes(search)
            );
        }

        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit;
        const paginatedData = filtered.slice(start, start + limit);

        return { 
            success: true, 
            data: paginatedData,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        };
    },
    async getContractById(id: string) {
        await delay(400);
        const ctr = contracts.find(c => c.id === id);
        if (!ctr) return { success: false, message: 'Contrato não encontrado' };
        return { success: true, data: { ...ctr } };
    },
    
    // AI Mock
    async generateContractWithAI(prompt: string) {
        await delay(2000); // Fake processing time
        return {
            success: true,
            data: `<p>Contrato gerado via IA a partir do prompt: <em>${prompt}</em></p><br/><p><b>Cláusula 1:</b> As partes concordam em...</p>`
        };
    },
    async analyzeContractRisks() {
        await delay(2500);
        return {
            success: true,
            data: [
                { id: 'r1', severity: 'high', clause: 'Pagamento', description: 'Multa por atraso não especificada.', suggestion: 'Incluir multa de 2% e juros de 1% a.m.' },
                { id: 'r2', severity: 'medium', clause: 'Rescisão', description: 'Prazo de aviso prévio ausente.', suggestion: 'Definir aviso prévio de 30 dias.' }
            ]
        };
    }
};
