import { marked } from "marked";
import {
    CompleteScope,
    ScopeUserNode,
    ScopePlatform,
    ScopeModule,
    ScopeScreen,
    ScopeFunctionality,
    ScopeIntegration,
} from "./_shared";

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateId = () => Math.random().toString(36).substring(2, 9);

/** Strip markdown bold markers and collapse whitespace */
const clean = (s: string) => s.replace(/\*\*/g, "").trim();

/** Remove a known label prefix like "Perfil:", "Plataforma:", etc. */
const stripPrefix = (text: string, label: string) =>
    clean(text).replace(new RegExp(`^.*?${label}\\s*:?\\s*`, "i"), "").trim() || clean(text);

/**
 * Fuzzy match: returns true if `candidate` is "close enough" to `target`.
 * Handles "Usuário 1" vs "Usuário" or "Web App" vs "Software Web".
 */
function fuzzyMatch(target: string, candidate: string): boolean {
    const t = target.toLowerCase().trim();
    const c = candidate.toLowerCase().trim();
    if (t === c) return true;
    if (c.includes(t) || t.includes(c)) return true;

    // Jaccard similarity on words
    const tw = new Set(t.split(/\s+/));
    const cw = new Set(c.split(/\s+/));
    const intersection = [...tw].filter((w) => cw.has(w)).length;
    const union = new Set([...tw, ...cw]).size;
    return union > 0 && intersection / union >= 0.4;
}

// ── Raw AI tree (what the AI actually generated) ─────────────────────────────

interface RawUser     { name: string; platforms: RawPlatform[] }
interface RawPlatform { name: string; modules: RawModule[] }
interface RawModule   { name: string; screens: RawScreen[] }
interface RawScreen   { name: string; functionalities: RawFunctionality[] }
interface RawFunctionality { title: string; description: string; estimatedHours: number }

function parseMarkdownRaw(md: string): { users: RawUser[]; integrations: RawFunctionality[] } {
    const tokens = marked.lexer(md);
    const users: RawUser[] = [];
    const integrations: RawFunctionality[] = [];

    let currentUser: RawUser | null = null;
    let currentPlatform: RawPlatform | null = null;
    let currentModule: RawModule | null = null;
    let currentScreen: RawScreen | null = null;
    let inIntegrations = false;

    for (const token of tokens) {
        if (token.type === "heading") {
            const text = token.text ?? "";
            const textClean = clean(text);

            if (token.depth === 2) {
                if (/integra/i.test(textClean)) {
                    inIntegrations = true;
                    currentUser = null; currentPlatform = null;
                    currentModule = null; currentScreen = null;
                } else {
                    inIntegrations = false;
                    currentUser = { name: stripPrefix(text, "Perfil"), platforms: [] };
                    users.push(currentUser);
                    currentPlatform = null; currentModule = null; currentScreen = null;
                }

            } else if (token.depth === 3 && currentUser && !inIntegrations) {
                currentPlatform = { name: stripPrefix(text, "Plataforma"), modules: [] };
                currentUser.platforms.push(currentPlatform);
                currentModule = null; currentScreen = null;

            } else if (token.depth === 4 && currentPlatform && !inIntegrations) {
                currentModule = { name: stripPrefix(text, "Módulo"), screens: [] };
                currentPlatform.modules.push(currentModule);
                currentScreen = null;

            } else if (token.depth === 5 && currentModule && !inIntegrations) {
                currentScreen = { name: stripPrefix(text, "Tela"), functionalities: [] };
                currentModule.screens.push(currentScreen);
            }

        } else if (token.type === "list") {
            for (const item of token.items) {
                const rawText: string =
                    item.text ||
                    (item.tokens?.[0]?.type === "text"
                        ? (item.tokens[0] as { text: string }).text
                        : "") ||
                    "";

                if (!rawText) continue;

                const r = clean(rawText);

                let title = "";
                let desc = "";
                let hours = 0;

                if (inIntegrations) {
                    // "Integração: Title | Descrição: desc | Horas: N"
                    // Covers "Integração" (with accent), "Integracao" and "Integration"
                    const t = r.match(/integra[cç][aã]o\s*:\s*([^|]+)/i);
                    if (t) title = t[1].trim();
                } else {
                    // "Funcionalidade: Title | Descrição: desc | Horas: N"
                    const t = r.match(/funcionalidade\s*:\s*([^|]+)/i);
                    if (t) title = t[1].trim();
                }

                // Fallback: use full text as title if no label found
                if (!title) title = r.replace(/^-?\s*/, "").trim();

                // Description
                const d = r.match(/descri[cç][aã]o\s*:\s*([^|]+)/i);
                if (d) desc = d[1].trim();

                // Hours — hard cap at 6h per functionality (matches prompt constraints)
                const h = r.match(/horas?\s*:\s*(\d+\.?\d*)/i);
                if (h) hours = Math.min(parseFloat(h[1]), 6);

                const entry: RawFunctionality = { title, description: desc, estimatedHours: hours };

                if (inIntegrations) {
                    integrations.push(entry);
                } else if (currentScreen) {
                    currentScreen.functionalities.push(entry);
                }
            }
        }
    }

    return { users, integrations };
}

// ── Build final scope using briefing as ground truth ─────────────────────────

/**
 * Merge strategy:
 *  - Users / Platforms → always from briefing (preserves original order & count)
 *  - Modules / Screens / Functionalities → from AI (injected via fuzzy user+platform match)
 *
 * Guarantees the user always sees the exact structure they defined,
 * regardless of what the AI chose to generate or omit.
 */
export function parseMarkdownToScope(md: string, briefing: CompleteScope): CompleteScope {
    const { users: rawUsers, integrations: rawIntegrations } = parseMarkdownRaw(md);

    const mergedUsers: ScopeUserNode[] = briefing.users.map((briefUser) => {
        const rawUser = rawUsers.find((ru) => fuzzyMatch(briefUser.userName, ru.name));

        const mergedPlatforms: ScopePlatform[] = briefUser.platforms.map((briefPlat) => {
            const rawPlat = rawUser?.platforms.find((rp) =>
                fuzzyMatch(briefPlat.platformName, rp.name)
            );

            const modules: ScopeModule[] = (rawPlat?.modules ?? []).map((rawMod) => {
                const screens: ScopeScreen[] = rawMod.screens.map((rawScr) => {
                    const functionalities: ScopeFunctionality[] = rawScr.functionalities.map((f) => ({
                        id: `f-${generateId()}`,
                        title: f.title,
                        description: f.description,
                        estimatedHours: f.estimatedHours,
                    }));
                    return {
                        id: `s-${generateId()}`,
                        title: rawScr.name,
                        description: "",
                        functionalities,
                    };
                });
                return { id: `m-${generateId()}`, title: rawMod.name, screens };
            });

            return {
                id: briefPlat.id || `p-${generateId()}`,
                platformName: briefPlat.platformName, // ← always from briefing
                objective: briefPlat.objective,
                modules,
            };
        });

        return {
            id: briefUser.id || `u-${generateId()}`,
            userName: briefUser.userName, // ← always from briefing
            platforms: mergedPlatforms,
        };
    });

    // Filter out non-integrations (internal libs, db, cache, routing, etc.)
    const NON_INTEGRATION_PATTERNS = [
        /\b(banco\s*de\s*dados|database|postgres|mysql|sqlite|prisma|mongoose|redis|cache|memcache)\b/i,
        /\b(axios|fetch|http\s*client|react|next\.?js|angular|vue|tailwind|bootstrap|scss|css)\b/i,
        /\b(local\s*storage|session\s*storage|cookie|roteamento|router|webpack|babel|eslint)\b/i,
        /\b(autenticação\s*pr[oó]pria|jwt\s*interno|bcrypt|hash|cript)\b/i,
    ];

    const filteredIntegrations = rawIntegrations
        .filter(i => !NON_INTEGRATION_PATTERNS.some(p => p.test(i.title)))
        .slice(0, 6); // Hard cap: max 6 integrations

    const integrations: ScopeIntegration[] = filteredIntegrations.map((i) => ({
        id: `i-${generateId()}`,
        title: i.title,
        description: i.description,
        estimatedHours: i.estimatedHours,
    }));

    return {
        ...briefing,
        users: mergedUsers,
        // Keep existing integrations if AI returned none
        integrations: integrations.length > 0 ? integrations : (briefing.integrations ?? []),
    };
}
