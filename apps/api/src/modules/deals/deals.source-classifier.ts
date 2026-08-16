// Classifies a deal's "Fonte" from the tracked landing-page URL captured at lead conversion
// (utm_source/gclid/fbclid/rdt_cid params). The "Fonte" dropdown on
// apps/web-comercial .../crm/pipeline/[id]/page.tsx no longer uses a hardcoded options list —
// it loads live from the Source table (Configurações > Fontes e Campanhas). These string
// constants must match an existing Source.name record exactly (case-sensitive) so a
// newly-classified deal lines up with that catalog for filters/reports.
export const DEAL_SOURCE_GOOGLE_ADS = "Google Ads";
export const DEAL_SOURCE_META_ADS = "Meta Ads (Facebook)";
// Value is "Bling Ads" (not "Bing Ads") on purpose — it must match the exact
// Source.name already registered in Configurações > Fontes e Campanhas.
export const DEAL_SOURCE_BING_ADS = "Bling Ads";
export const DEAL_SOURCE_REDDIT = "RD";
// ChatGPT Ads (OpenAI Ads). Precisa bater exatamente com a Source.name "Ads ChatGPT"
// já cadastrada em Configurações > Fontes e Campanhas. NÃO confundir com "Org ChatGPT",
// que é o tráfego orgânico vindo de respostas do ChatGPT (utm_source=chatgpt.com) e
// continua fora desta classificação de propósito.
export const DEAL_SOURCE_CHATGPT_ADS = "Ads ChatGPT";
export const DEAL_SOURCE_ORGANIC = "Google Orgânico (SEO)";

const CONVERSION_URL_FIELD_REGEX = /(?:URL de convers[aã]o|Dados da URL)\s*:\s*(\S+)/gi;

function classifyTrackedUrl(rawValue: string | null | undefined): string | null {
    if (!rawValue) return null;
    const trimmed = rawValue.trim();
    if (!trimmed || trimmed === "/") return null;

    let decoded: string;
    try {
        decoded = decodeURIComponent(trimmed);
    } catch {
        decoded = trimmed;
    }
    const lower = decoded.toLowerCase();

    // ChatGPT Ads vem primeiro: o `oppref` é o identificador de clique do OpenAI Ads
    // (equivalente ao gclid/fbclid — o SDK do pixel também o grava no cookie __oppref),
    // então é o sinal mais confiável de que o lead veio de anúncio no ChatGPT.
    // Avaliado antes do Meta porque aquele bloco usa substring solta de "facebook"/
    // "instagram" e poderia sequestrar uma URL de campanha que cite essas palavras.
    // utm_source=chatgpt sozinho NÃO entra aqui — esse é o orgânico ("Org ChatGPT").
    // Não usar um fallback tipo `chatgpt` em qualquer lugar da URL + utm_medium pago:
    // isso sequestrava campanhas reais do Google/Meta Ads cujo utm_campaign/utm_content
    // só menciona "chatgpt" (ex.: uma campanha "automação com chatgpt" rodando no Google
    // Ads com gclid legítimo) antes mesmo de a checagem de Google Ads rodar.
    const isChatGptAds =
        lower.includes("oppref=") ||
        /utm_source=(chatgpt[_-]?ads|openai[_-]?ads|openai)\b/.test(lower);
    if (isChatGptAds) return DEAL_SOURCE_CHATGPT_ADS;

    const isGoogleAds =
        lower.includes("gclid=") ||
        lower.includes("gad_source=") ||
        lower.includes("gad_campaignid=") ||
        lower.includes("gbraid=") ||
        lower.includes("utm_source=googleads") ||
        lower.includes("utm_source=google");
    if (isGoogleAds) return DEAL_SOURCE_GOOGLE_ADS;

    const isMetaAds =
        lower.includes("fbclid=") ||
        lower.includes("utm_source=metaads") ||
        lower.includes("utm_source=meta") ||
        lower.includes("facebook") ||
        lower.includes("instagram");
    if (isMetaAds) return DEAL_SOURCE_META_ADS;

    const isBingAds =
        lower.includes("msclkid=") ||
        lower.includes("utm_source=bing") ||
        lower.includes("utm_source=microsoft");
    if (isBingAds) return DEAL_SOURCE_BING_ADS;

    const isReddit =
        lower.includes("rdt_cid=") ||
        lower.includes("utm_source=reddit");
    if (isReddit) return DEAL_SOURCE_REDDIT;

    return null;
}

/** Extracts every "URL de conversão:"/"Dados da URL:" value from a DealNote's free-text content. */
export function extractConversionUrlValues(content: string): string[] {
    const values: string[] = [];
    const re = new RegExp(CONVERSION_URL_FIELD_REGEX);
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
        values.push(match[1]);
    }
    return values;
}

/** Classifies a source from a list of raw conversion-URL/urlData values, tried in order; falls back to organic. */
export function classifySourceLabel(values: Array<string | null | undefined>): string {
    for (const value of values) {
        const label = classifyTrackedUrl(value);
        if (label) return label;
    }
    return DEAL_SOURCE_ORGANIC;
}

/**
 * Classifies source directly from the raw conversionUrl/urlData captured at lead-ingestion time.
 * Returns null when neither field carries any data — i.e. this lead didn't come through the
 * tracked web form, so the caller should keep whatever source it already had instead of
 * forcing "Google Orgânico (SEO)".
 */
export function classifySourceFromConversionInput(
    conversionUrl?: string | null,
    urlData?: string | null
): string | null {
    if (!conversionUrl?.trim() && !urlData?.trim()) return null;
    return classifySourceLabel([urlData, conversionUrl]);
}
