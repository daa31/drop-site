export const COMPARE_KEY = "fortis_compare";
export const COMPARE_EVENT = "locko:compare-updated";

export type CompareChange = {
  slug: string;
  added: boolean;
  slugs: string[];
};

function uniqueSlugs(slugs: string[]) {
  return Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
}

export function readCompareSlugs() {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
    return Array.isArray(v) ? uniqueSlugs(v.filter((s): s is string => typeof s === "string")) : [];
  } catch {
    return [];
  }
}

function writeCompareSlugs(slugs: string[]) {
  const next = uniqueSlugs(slugs);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  return next;
}

function emitCompareChange(change: CompareChange) {
  window.dispatchEvent(new CustomEvent<CompareChange>(COMPARE_EVENT, { detail: change }));
}

export function setCompareSlug(slug: string, added: boolean) {
  const current = readCompareSlugs();
  const next = added ? writeCompareSlugs([...current, slug]) : writeCompareSlugs(current.filter((s) => s !== slug));
  const change = { slug, added, slugs: next };
  emitCompareChange(change);
  return change;
}

export function toggleCompareSlug(slug: string) {
  return setCompareSlug(slug, !readCompareSlugs().includes(slug));
}
