export const WISHLIST_KEY = "fortis_wish";
export const WISHLIST_EVENT = "locko:wishlist-updated";

export type WishlistChange = {
  slug: string;
  added: boolean;
  slugs: string[];
};

function uniqueSlugs(slugs: string[]) {
  return Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean)));
}

export function readWishlistSlugs() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(value) ? uniqueSlugs(value.filter((slug): slug is string => typeof slug === "string")) : [];
  } catch {
    return [];
  }
}

function writeWishlistSlugs(slugs: string[]) {
  const next = uniqueSlugs(slugs);
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return next;
}

function emitWishlistChange(change: WishlistChange) {
  window.dispatchEvent(new CustomEvent<WishlistChange>(WISHLIST_EVENT, { detail: change }));
}

export function setWishlistSlug(slug: string, added: boolean) {
  const current = readWishlistSlugs();
  const next = added ? writeWishlistSlugs([...current, slug]) : writeWishlistSlugs(current.filter((item) => item !== slug));
  const change = { slug, added, slugs: next };
  emitWishlistChange(change);
  return change;
}

export function toggleWishlistSlug(slug: string) {
  return setWishlistSlug(slug, !readWishlistSlugs().includes(slug));
}
