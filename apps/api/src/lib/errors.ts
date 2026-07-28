export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 400, code = "APP_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} não encontrado(a)`, 404, "NOT_FOUND");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Não autorizado") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Acesso negado") {
        super(message, 403, "FORBIDDEN");
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(errors: Record<string, string[]>) {
        super("Erro de validação", 422, "VALIDATION_ERROR");
        this.errors = errors;
    }
}

export class ConflictError extends AppError {
    constructor(message = "Recurso já existe") {
        super(message, 409, "CONFLICT");
    }
}
