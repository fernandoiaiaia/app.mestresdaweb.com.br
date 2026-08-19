import { describe, expect, it } from "vitest";
import {
    CONTACT_DEDUPE_SCOPE,
    contactIdentity,
    identityLockKeys,
    normalizeEmail,
    phoneIdentityKey,
} from "./contact-identity.js";

// A deduplicação da pipeline inteira depende destas chaves. Cada caso abaixo veio de um
// par que já duplicou lead em produção — se a normalização regredir, o card duplicado volta.
describe("phoneIdentityKey", () => {
    it("converge as variações de escrita do mesmo celular", () => {
        const expected = "5511987654321";
        expect(phoneIdentityKey("+55 11 98765-4321")).toBe(expected);
        expect(phoneIdentityKey("(11) 98765-4321")).toBe(expected);
        expect(phoneIdentityKey("11987654321")).toBe(expected);
        expect(phoneIdentityKey("5511987654321")).toBe(expected);
        expect(phoneIdentityKey("+55 (11) 9 8765 4321")).toBe(expected);
    });

    it("reconhece o celular legado sem o nono dígito como a mesma pessoa", () => {
        // Formato que a Meta entrega no webhook do WhatsApp.
        expect(phoneIdentityKey("551187654321")).toBe("5511987654321");
        expect(phoneIdentityKey("1187654321")).toBe("5511987654321");
    });

    it("não inventa nono dígito para telefone fixo", () => {
        expect(phoneIdentityKey("(11) 3322-4455")).toBe("551133224455");
        expect(phoneIdentityKey("551133224455")).toBe("551133224455");
    });

    it("descarta número curto demais para identificar alguém", () => {
        // Sem DDD, "987654321" casaria com qualquer estado — fundir seria pior que duplicar.
        expect(phoneIdentityKey("98765-4321")).toBeNull();
        expect(phoneIdentityKey("4321")).toBeNull();
        expect(phoneIdentityKey("")).toBeNull();
        expect(phoneIdentityKey(null)).toBeNull();
    });

    it("rejeita DDD inválido", () => {
        expect(phoneIdentityKey("0198765432")).toBeNull();
        expect(phoneIdentityKey("1098765432")).toBeNull();
    });

    it("mantém número estrangeiro como chave exata", () => {
        expect(phoneIdentityKey("+1 415 555 2671")).toBe("14155552671");
        expect(phoneIdentityKey("+351 912 345 678")).toBe("351912345678");
    });

    it("descarta prefixo de discagem internacional", () => {
        expect(phoneIdentityKey("005511987654321")).toBe("5511987654321");
    });

    it("não funde celulares diferentes que terminam igual", () => {
        // Regressão do sufixo de 10 dígitos: DDDs distintos são pessoas distintas.
        expect(phoneIdentityKey("11987654321")).not.toBe(phoneIdentityKey("21987654321"));
    });
});

describe("normalizeEmail", () => {
    it("normaliza caixa e espaços", () => {
        expect(normalizeEmail("  Joao@Empresa.COM ")).toBe("joao@empresa.com");
    });

    it("trata vazio como ausente", () => {
        expect(normalizeEmail("   ")).toBeNull();
        expect(normalizeEmail(undefined)).toBeNull();
    });
});

describe("identityLockKeys", () => {
    it("emite as chaves sempre na mesma ordem, independente da origem", () => {
        const a = identityLockKeys(CONTACT_DEDUPE_SCOPE, contactIdentity("Joao@X.com", "+55 11 98765-4321"));
        const b = identityLockKeys(CONTACT_DEDUPE_SCOPE, contactIdentity("joao@x.com", "551187654321"));
        expect(a).toEqual(b);
        expect(a).toEqual([...a].sort());
    });

    it("separa escopos distintos", () => {
        const a = identityLockKeys("escopo-a", contactIdentity("j@x.com", null));
        const b = identityLockKeys("escopo-b", contactIdentity("j@x.com", null));
        expect(a).not.toEqual(b);
    });

    it("não trava nada quando não há identificador utilizável", () => {
        expect(identityLockKeys(CONTACT_DEDUPE_SCOPE, contactIdentity(null, "4321"))).toEqual([]);
    });
});
