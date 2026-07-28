// ═══════════════════════════════════════
// Shared API Types — ProposalAI
// ═══════════════════════════════════════

// Standard API Response
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        errors?: Record<string, string[]>;
    };
}

// User
export interface UserDTO {
    id: string;
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "USER" | "VIEWER";
    avatar?: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// Auth
export interface AuthResponse {
    user: Pick<UserDTO, "id" | "name" | "email" | "role">;
    accessToken: string;
    refreshToken: string;
}

// Pagination
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
