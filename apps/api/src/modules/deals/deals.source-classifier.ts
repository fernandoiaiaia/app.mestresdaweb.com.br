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

    // ── Sinais de alta confiança do ChatGPT Ads (checados primeiro) ──
    // `oppref` é o identificador de clique do OpenAI Ads (equivalente ao gclid/fbclid —
    // o SDK do pixel também o grava no cookie __oppref) — inequívoco, não colide com
    // nenhuma outra plataforma. utm_source=chatgpt sozinho NÃO entra aqui — esse é o
    // orgânico ("Org ChatGPT"), só o sufixo _ads/openai_ads/openai conta como pago.
    const hasChatGptAdsSignal =
        lower.includes("oppref=") ||
        /utm_source=(chatgpt[_-]?ads|openai[_-]?ads|openai)\b/.test(lower);
    if (hasChatGptAdsSignal) return DEAL_SOURCE_CHATGPT_ADS;

    const isGoogleAds =
        lower.includes("gclid=") ||
        lower.includes("gad_source=") ||
        lower.includes("gad_campaignid=") ||
        lower.includes("gbraid=") ||
        lower.includes("wbraid=") ||
        lower.includes("utm_source=googleads") ||
        lower.includes("utm_source=google");
    if (isGoogleAds) return DEAL_SOURCE_GOOGLE_ADS;

    // Ancorado em utm_source= (não substring livre): uma campanha de Google/Bing/Reddit
    // cujo utm_campaign só cite "facebook"/"instagram" (comum em nomes tipo
    // "promo-stories-instagram-style") não deve ser sequestrada pro Meta — mesma classe
    // de bug que já corrigimos pro ChatGPT (ver histórico de commits deste arquivo).
    const isMetaAds =
        lower.includes("fbclid=") ||
        /utm_source=(meta[_-]?ads|facebook[_-]?ads|instagram[_-]?ads|facebook|instagram|fb|ig)\b/.test(lower);
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

    // ── Sinal de baixa confiança do ChatGPT Ads (checado por último, como fallback) ──
    // As campanhas reais em Configurações > Fontes e Campanhas do Ads Manager do ChatGPT
    // (ex.: anúncio "app-chatgpt") NÃO têm o macro {oppref} preenchido no campo "Parâmetros
    // de consulta da página de destino" — só campaign_id/ad_group_id/ad_id/service. Por
    // isso o trio campaign_id+ad_group_id+ad_id (nomes de macro do Ads Manager do ChatGPT)
    // é tratado como sinal equivalente ao oppref — mas só depois de descartar todo sinal
    // inequívoco de outra plataforma acima, porque esses três nomes de parâmetro não são
    // exclusivos da OpenAI: uma agência pode usá-los num tracking template customizado do
    // Google/Bing Ads, e nesse caso o gclid/msclkid genuíno tem que vencer. Idealmente
    // adicionar "&oppref={oppref}" ao campo de parâmetros no Ads Manager também ajudaria a
    // atribuição de conversão do lado do próprio OpenAI, mas o classificador não deve
    // depender só disso.
    const hasChatGptMacroTrio =
        lower.includes("campaign_id=") && lower.includes("ad_group_id=") && lower.includes("ad_id=");
    if (hasChatGptMacroTrio) return DEAL_SOURCE_CHATGPT_ADS;

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
