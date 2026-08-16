import { describe, expect, it } from "vitest";
import {
    classifySourceLabel,
    DEAL_SOURCE_GOOGLE_ADS,
    DEAL_SOURCE_META_ADS,
    DEAL_SOURCE_BING_ADS,
    DEAL_SOURCE_REDDIT,
    DEAL_SOURCE_CHATGPT_ADS,
    DEAL_SOURCE_CHATGPT_ORGANIC,
    DEAL_SOURCE_ORGANIC,
} from "./deals.source-classifier.js";

// Este classificador já foi corrigido 4x no mesmo dia por bugs de sequestro entre
// plataformas (substring solta capturando URL de outra plataforma). Cobrir os casos
// adversariais aqui evita que a próxima mudança reintroduza um dos bugs já corrigidos.
describe("classifySourceLabel", () => {
    it("reconhece ChatGPT Ads via oppref", () => {
        expect(classifySourceLabel(["https://x.com/?oppref=gAAAAAB123"])).toBe(DEAL_SOURCE_CHATGPT_ADS);
    });

    it("reconhece ChatGPT Ads via utm_source explícito", () => {
        expect(classifySourceLabel(["https://x.com/?utm_source=chatgpt_ads&utm_medium=cpc"])).toBe(DEAL_SOURCE_CHATGPT_ADS);
    });

    it("reconhece ChatGPT Ads via trio de macros do Ads Manager (fallback)", () => {
        expect(
            classifySourceLabel(["https://x.com/?campaign_id=1&ad_group_id=2&ad_id=3&service=software"]),
        ).toBe(DEAL_SOURCE_CHATGPT_ADS);
    });

    it("NÃO trata utm_source=chatgpt puro (sem _ads) como pago — é orgânico do ChatGPT", () => {
        expect(classifySourceLabel(["https://x.com/?utm_source=chatgpt.com"])).toBe(DEAL_SOURCE_CHATGPT_ORGANIC);
    });

    it("reconhece ChatGPT orgânico (citação do ChatGPT Search) via utm_source=chatgpt.com", () => {
        expect(classifySourceLabel(["https://x.com/?utm_source=chatgpt.com&utm_medium=referral"])).toBe(DEAL_SOURCE_CHATGPT_ORGANIC);
    });

    it("reconhece Google Ads via gclid", () => {
        expect(classifySourceLabel(["https://x.com/?gclid=abc123"])).toBe(DEAL_SOURCE_GOOGLE_ADS);
    });

    it("NÃO deixa uma campanha de Google Ads que cite 'chatgpt' virar Ads ChatGPT", () => {
        expect(
            classifySourceLabel(["https://x.com/?gclid=abc123&utm_campaign=automacao-chatgpt-leads"]),
        ).toBe(DEAL_SOURCE_GOOGLE_ADS);
    });

    it("NÃO deixa um gclid real perder pro trio de macros do ChatGPT coincidindo na mesma URL", () => {
        expect(
            classifySourceLabel(["https://x.com/?gclid=real123&campaign_id=1&ad_group_id=2&ad_id=3"]),
        ).toBe(DEAL_SOURCE_GOOGLE_ADS);
    });

    it("reconhece Meta Ads via fbclid", () => {
        expect(classifySourceLabel(["https://x.com/?fbclid=xyz789"])).toBe(DEAL_SOURCE_META_ADS);
    });

    it("NÃO deixa uma campanha de Bing Ads que cite 'instagram' virar Meta Ads", () => {
        expect(
            classifySourceLabel(["https://x.com/?msclkid=abc&utm_source=bing&utm_campaign=promo-stories-instagram-style"]),
        ).toBe(DEAL_SOURCE_BING_ADS);
    });

    it("NÃO deixa uma campanha do Reddit que cite 'facebook' virar Meta Ads", () => {
        expect(
            classifySourceLabel(["https://x.com/?rdt_cid=rrr222&utm_campaign=facebook-lookalike-remarketing"]),
        ).toBe(DEAL_SOURCE_REDDIT);
    });

    it("reconhece Bing Ads via msclkid", () => {
        expect(classifySourceLabel(["https://x.com/?msclkid=qqq111"])).toBe(DEAL_SOURCE_BING_ADS);
    });

    it("reconhece Reddit via rdt_cid", () => {
        expect(classifySourceLabel(["https://x.com/?rdt_cid=rrr222"])).toBe(DEAL_SOURCE_REDDIT);
    });

    it("cai em orgânico sem nenhum parâmetro reconhecido", () => {
        expect(classifySourceLabel(["https://x.com/"])).toBe(DEAL_SOURCE_ORGANIC);
        expect(classifySourceLabel([null, undefined])).toBe(DEAL_SOURCE_ORGANIC);
    });

    it("não dispara o trio do ChatGPT com só um ou dois dos três macros presentes", () => {
        expect(classifySourceLabel(["https://x.com/?ad_id=123&foo=bar"])).toBe(DEAL_SOURCE_ORGANIC);
        expect(classifySourceLabel(["https://x.com/?campaign_id=1&ad_group_id=2"])).toBe(DEAL_SOURCE_ORGANIC);
    });
});
