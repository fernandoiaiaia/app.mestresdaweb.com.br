// ═══════════════════════════════════════
// Simple Logger
// ═══════════════════════════════════════

export const logger = {
    info: (obj: any, msg?: string) => {
        console.log("[INFO]", msg || "", typeof obj === "string" ? obj : JSON.stringify(obj));
    },
    warn: (obj: any, msg?: string) => {
        console.warn("[WARN]", msg || "", typeof obj === "string" ? obj : JSON.stringify(obj));
    },
    error: (obj: any, msg?: string) => {
        console.error("[ERROR]", msg || "", typeof obj === "string" ? obj : JSON.stringify(obj));
    },
};
