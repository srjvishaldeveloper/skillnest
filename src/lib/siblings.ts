/**
 * URLs of the sibling platforms in the HubNest ecosystem. Override per
 * environment; defaults target the local dev servers.
 * - HubNest  — parent company / umbrella landing
 * - JobNest  — job marketplace (SvelteKit site)
 * - SkillNest — learning platform (this app)
 * - GigNest  — freelance / gig marketplace
 */
const clean = (u: string) => u.replace(/\/+$/, "");

export const HUBNEST_URL = clean(process.env.NEXT_PUBLIC_HUBNEST_URL || "http://localhost:8080");
export const JOBNEST_URL = clean(process.env.NEXT_PUBLIC_JOBNEST_URL || "http://localhost:5173");
export const GIGNEST_URL = clean(process.env.NEXT_PUBLIC_GIGNEST_URL || "http://localhost:5180");
