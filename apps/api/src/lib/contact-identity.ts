/**
 * Identidade canônica de contato — fonte única de verdade para deduplicação.
 *
 * Todo canal de entrada de lead (form do site, webhook inbound, WhatsApp, importação
 * de planilha, cadastro manual no CRM) precisa derivar as chaves daqui. Antes existiam
 * duas heurísticas divergentes — o roteamento por afinidade usava `LIKE '%sufixo%'` e a
 * deduplicação usava `LIKE '%sufixo'` com corte de 10 dígitos — então o sistema
 * reconhecia a pessoa para mandar ao consultor certo e, ao mesmo tempo, não a
 * reconhecia na hora de reaproveitar o negócio, abrindo um card novo na pipeline.
 */

const BR_DDI = "55";

/** DDDs brasileiros vão de 11 a 99 (o segundo dígito nunca é 0 ou 1 em DDD válido). */
function isValidBrDdd(ddd: string): boolean {
    if (ddd.length !== 2) return false;
    const n = Number(ddd);
    return n >= 11 && n <= 99;
}

export function normalizeEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    const trimmed = String(email).trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
}

/** Só os dígitos, para persistir/comparar sem pontuação. */
export function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
}

/**
 * Chave canônica de telefone: E.164 sem o "+".
 *
 * O caso que mais duplicava lead era o nono dígito do celular: a Meta entrega
 * "551187654321" (formato legado, sem o 9) enquanto o formulário do site grava
 * "+55 11 98765-4321". São a mesma pessoa, e qualquer comparação por sufixo os
 * separa. Aqui os dois convergem para "5511987654321".
 *
 * Retorna null quando o número é curto demais para identificar alguém com segurança
 * (ex.: 9 dígitos, sem DDD): nesse caso vale mais abrir um contato a mais do que
 * fundir duas pessoas distintas que só compartilham o final do número.
 */
export function phoneIdentityKey(phone: string | null | undefined): string | null {
    let digits = normalizePhone(phone);
    if (!digits) return null;

    // Prefixo de discagem internacional ("00" + país) usado por alguns discadores.
    if (digits.startsWith("00") && digits.length >= 12) digits = digits.slice(2);

    const brazilian = toBrazilianKey(digits);
    if (brazilian) return brazilian;

    // Não reconhecido como brasileiro: números longos usam a própria sequência de
    // dígitos como chave — a comparação segue exata, então não há falso positivo.
    // Curtos demais (sem DDD) ficam sem chave de propósito.
    return digits.length >= 11 ? digits : null;
}

function toBrazilianKey(digits: string): string | null {
    let national: string;

    if (digits.startsWith(BR_DDI) && (digits.length === 12 || digits.length === 13)) {
        national = digits.slice(2);
    } else if (digits.length === 10 || digits.length === 11) {
        national = digits;
    } else {
        return null;
    }

    const ddd = national.slice(0, 2);
    if (!isValidBrDdd(ddd)) return null;

    let subscriber = national.slice(2);

    // Celular legado (8 dígitos começando em 6-9) ganha o nono dígito; fixo fica intacto.
    if (subscriber.length === 8 && /^[6-9]/.test(subscriber)) {
        subscriber = `9${subscriber}`;
    }

    // Só assume Brasil quando o número realmente tem forma brasileira. Sem esta guarda
    // um "+1 415 555 2671" vira "DDD 14" e ganha um 55 na frente.
    const isMobile = subscriber.length === 9 && subscriber.startsWith("9");
    const isLandline = subscriber.length === 8 && /^[2-5]/.test(subscriber);
    if (!isMobile && !isLandline) return null;

    return `${BR_DDI}${ddd}${subscriber}`;
}

export interface ContactIdentity {
    emailKey: string | null;
    phoneKey: string | null;
}

export function contactIdentity(
    email: string | null | undefined,
    phone: string | null | undefined,
): ContactIdentity {
    return { emailKey: normalizeEmail(email), phoneKey: phoneIdentityKey(phone) };
}

/**
 * Escopo de deduplicação. O produto opera como uma única organização: os leads
 * públicos entram todos sob o OWNER (lib/get-owner.ts) e os demais `userId` são
 * vendedores da mesma casa, não inquilinos isolados — tanto que a listagem de
 * contatos já cruza a fronteira via `deals.consultantId`. Um escopo só garante que
 * o mesmo humano seja reconhecido venha ele do site, do WhatsApp ou de uma planilha.
 */
export const CONTACT_DEDUPE_SCOPE = "contact-identity";

/**
 * Chaves de lock ordenadas — um contato pode ser identificado por e-mail e por
 * telefone ao mesmo tempo, e duas requisições concorrentes que travassem as duas
 * em ordens opostas se deadlockariam. Ordenar dá a todas a mesma sequência.
 */
export function identityLockKeys(scope: string, identity: ContactIdentity): string[] {
    const keys: string[] = [];
    if (identity.emailKey) keys.push(`${scope}|email|${identity.emailKey}`);
    if (identity.phoneKey) keys.push(`${scope}|phone|${identity.phoneKey}`);
    return keys.sort();
}
