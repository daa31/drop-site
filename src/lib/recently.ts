const RECENT_KEY = "locko_recent";

export const RECENT_EVENT = "locko:recent-changed";

export function readRecentSlugs(limit = 8): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is string => typeof x === "string").slice(0, limit);
  } catch {
    return [];
  }
}

export function trackRecentSlug(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  const current = readRecentSlugs(12);
  const next = [slug, ...current.filter((s) => s !== slug)].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENT_EVENT));
  } catch {
    /* ignore */
  }
}
