import { timingSafeEqual } from "crypto";
import { env } from "../../config/env.js";

/** Bearer CONNECH_TO_ADVISOR_SECRET — usado por todos os endpoints que o Connech chama. */
export function isAuthorizedConnechRequest(authHeader: string | undefined): boolean {
    if (!env.CONNECH_TO_ADVISOR_SECRET || !authHeader?.startsWith("Bearer ")) return false;

    const token = Buffer.from(authHeader.slice("Bearer ".length).trim());
    const secret = Buffer.from(env.CONNECH_TO_ADVISOR_SECRET);
    if (token.length !== secret.length) return false;
    return timingSafeEqual(token, secret);
}
