import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../lib/errors.js";

type Source = "body" | "params" | "query";
type SchemaMap = Partial<Record<Source, ZodSchema>>;

/**
 * Validate middleware — supports two signatures:
 * 1. validate(schema, source)  — single source validation
 * 2. validate({ body: schema, params: schema }) — multi-source validation
 */
export function validate(schemaOrMap: ZodSchema | SchemaMap, source?: Source) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            if (source || schemaOrMap instanceof ZodSchema || typeof (schemaOrMap as any).parse === "function") {
                // Single source mode
                const schema = schemaOrMap as ZodSchema;
                const src = source || "body";
                const data = schema.parse(req[src]);
                req[src] = data;
            } else {
                // Multi-source mode
                const map = schemaOrMap as SchemaMap;
                for (const [src, schema] of Object.entries(map)) {
                    if (schema) {
                        const data = schema.parse(req[src as Source]);
                        (req as any)[src] = data;
                    }
                }
            }
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                err.errors.forEach((e) => {
                    const field = e.path.join(".");
                    if (!errors[field]) errors[field] = [];
                    errors[field].push(e.message);
                });
                throw new ValidationError(errors);
            }
            throw err;
        }
    };
}
