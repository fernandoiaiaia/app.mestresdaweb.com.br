import { Request } from "express";
import { FileFilterCallback } from "multer";
import { AppError } from "./errors.js";

export const ALLOWED_DOCUMENT_MIMES = [
    // Imagens seguras (Strict)
    "image/jpeg",
    "image/png",
    "image/webp",
    // Documentos PDF
    "application/pdf",
    // Textos
    "text/plain",
    "text/csv",
    // Microsoft Office
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

export const ALLOWED_IMAGE_MIMES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export function createSafeFileFilter(allowedMimes: string[] = ALLOWED_DOCUMENT_MIMES) {
    return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError(`Tipo de arquivo não permitido por segurança: ${file.mimetype}`, 415, "UNSUPPORTED_MEDIA_TYPE") as any);
        }
    };
}
