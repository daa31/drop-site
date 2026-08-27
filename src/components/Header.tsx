"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { tJson } from "@/lib/utils";

type Cat = { slug: string; name: unknown };
type WishItem = { slug: string; sku: string; name: unknown; brand?: { name: string } | null; images?: { url: string }[] };

export function Header({
  locale,
  categories,
  cartCount,
  user,
}: {
  locale: string;
  categories: Cat[];
  cartCount: number;
  user: { name: string; role: string } | null;
}) {
  const t = useTranslations("nav");
  const w = useTranslations("wishlist");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hits, setHits] = useState<{ slug: string; name: string; sku: string; image?: string | null }[]>([]);
  const [cartItems, setCartItems] = useState(cartCount);
  const [wishOpen, setWishOpen] = useState(false);
  const [wishItems, setWishItems] = useState<WishItem[]>([]);
  const path = usePathname();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setCartItems(cartCount), [cartCount]);

  useEffect(() => {
    function update(event: Event) {
      const qty = (event as CustomEvent<{ qty?: number }>).detail?.qty || 1;
      setCartItems((count) => count + qty);
    }
    window.addEventListener("locko:cart-added", update);
    return () => window.removeEventListener("locko:cart-added", update);
  }, []);

  async function openWishlist() {
    setWishOpen(true);
    await refreshWishlist();
  }

  async function refreshWishlist() {
    const slugs = JSON.parse(localStorage.getItem("fortis_wish") || "[]") as string[];
    const rows = await Promise.all(slugs.slice(0, 12).map((slug) => fetch(`/api/products/${slug}`).then((res) => (res.ok ? res.json() : null))));
    setWishItems(rows.filter(Boolean));
  }

  useEffect(() => {
    if (!wishOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [wishOpen]);

  useEffect(() => {
    function update() {
      if (wishOpen) void refreshWishlist();
    }
    window.addEventListener("locko:wishlist-updated", update);
    return () => window.removeEventListener("locko:wishlist-updated", update);
  }, [wishOpen]);

  const openWishlistText = locale === "ru" ? "Открыть избранное" : locale === "en" ? "Open wishlist" : "Відкрити обране";

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
      const data = await res.json();
      setHits(data.items || []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(id);
  }, [q, locale]);

  const locales = useMemo(
    () =>
      [
        { id: "uk", label: "UA" },
        { id: "ru", label: "RU" },
        { id: "en", label: "EN" },
      ] as const,
    [],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f8f6]/92 backdrop-blur-xl">
      <div className="container-f flex h-[72px] items-center gap-3">
        <button className="focus-ring grid h-10 w-10 place-items-center rounded-full lg:hidden" aria-label={t("menu")} onClick={() => setMenu(true)}>
          <Menu size={22} />
        </button>
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded bg-ink text-sm font-semibold text-white">L</span>
          <span className="font-display text-xl font-semibold tracking-[0.18em]">Locko</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 text-sm lg:flex">
          <Link href="/catalog" className="rounded-full px-4 py-2 font-medium hover:bg-white">
            {t("catalog")}
          </Link>
          <Link href="/guide" className="rounded-full px-4 py-2 hover:bg-white">
            {t("guide")}
          </Link>
          <Link href="/brands" className="rounded-full px-4 py-2 hover:bg-white">
            {t("brands")}
          </Link>
        </nav>
        <div className="relative mx-auto hidden w-full max-w-lg md:block" ref={box}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/catalog?q=${encodeURIComponent(q)}`);
              setOpen(false);
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/45" size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="focus-ring h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-4 text-sm shadow-sm"
            />
          </form>
          {open && hits.length > 0 && (
            <div className="absolute mt-2 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_24px_70px_rgba(17,18,20,0.16)]">
              {hits.map((h) => (
                <Link key={h.slug} href={`/product/${h.slug}`} prefetch={false} className="flex gap-3 px-4 py-3 text-sm hover:bg-mist" onClick={() => setOpen(false)}>
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eef0ed]">
                    {h.image ? (
                      <Image src={h.image} alt="" width={56} height={56} sizes="56px" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <span className="text-[10px] font-semibold text-graphite/35">Locko</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-medium leading-snug">{h.name}</span>
                    <span className="mt-1 block text-xs text-graphite/60">{h.sku}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden rounded-full border border-black/10 bg-white p-1 text-xs font-semibold sm:flex">
            {locales.map((l) => (
              <Link key={l.id} href={path} locale={l.id} className={`rounded-full px-2 py-1 ${l.id === locale ? "bg-ink text-white" : "text-graphite/55"}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <button type="button" onClick={openWishlist} data-wishlist-target className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white" aria-label={t("wishlist")}>
            <Heart size={19} />
          </button>
          <Link href={user ? "/account" : "/login"} className="focus-ring hidden h-10 w-10 place-items-center rounded-full bg-white sm:grid" aria-label={t("account")}>
            <User size={19} />
          </Link>
          <Link href="/cart" data-cart-target className="focus-ring relative grid h-10 w-10 place-items-center rounded-full bg-ink text-white" aria-label={t("cart")}>
            <ShoppingBag size={19} />
            {cartItems > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {cartItems}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="container-f pb-3 md:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/catalog?q=${encodeURIComponent(q)}`);
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm" />
        </form>
      </div>

      {menu && (
        <div className="fixed inset-0 z-[60] bg-ink/45 lg:hidden" onClick={() => setMenu(false)}>
          <div className="h-full w-[88%] max-w-sm bg-[#f8f8f6] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg font-semibold tracking-[0.18em]">Locko</span>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setMenu(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-2 text-sm">
              <Link href="/catalog" onClick={() => setMenu(false)} className="rounded-lg bg-ink px-4 py-3 font-semibold text-white">
                {t("catalog")}
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/catalog/${c.slug}`} onClick={() => setMenu(false)} className="rounded-lg bg-white px-4 py-3 text-graphite">
                  {tJson(c.name, locale)}
                </Link>
              ))}
              <Link href="/guide" onClick={() => setMenu(false)} className="rounded-lg bg-white px-4 py-3">
                {t("guide")}
              </Link>
              <Link href="/brands" className="rounded-lg bg-white px-4 py-3">
                {t("brands")}
              </Link>
              <Link href="/delivery" className="rounded-lg bg-white px-4 py-3">
                {t("delivery")}
              </Link>
              <Link href="/contacts" className="rounded-lg bg-white px-4 py-3">
                {t("contacts")}
              </Link>
            </div>
          </div>
        </div>
      )}
      {wishOpen && (
        <div className="fixed inset-0 z-[70] w-screen overflow-hidden bg-ink/45" onClick={() => setWishOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-[min(420px,100vw)] max-w-[100vw] flex-col bg-[#f8f8f6] shadow-[0_24px_80px_rgba(17,18,20,0.28)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-[72px] items-center justify-between border-b border-black/10 px-5">
              <div className="flex items-center gap-2 font-semibold">
                <Heart size={18} />
                {w("title")}
              </div>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setWishOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {wishItems.length === 0 ? (
                <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-graphite/65 shadow-card">
                  {w("empty")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {wishItems.map((item) => (
                    <Link key={item.slug} href={`/product/${item.slug}`} prefetch={false} onClick={() => setWishOpen(false)} className="flex gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-card transition hover:border-ink">
                      <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eef0ed]">
                        {item.images?.[0]?.url ? (
                          <Image src={item.images[0].url} alt="" width={64} height={64} sizes="64px" className="h-full w-full object-contain p-1.5" />
                        ) : (
                          <span className="text-[10px] font-semibold text-graphite/35">Locko</span>
                        )}
                      </span>
                      <span className="min-w-0 text-sm">
                        <span className="line-clamp-2 font-semibold leading-snug">{tJson(item.name, locale)}</span>
                        <span className="mt-1 block text-xs text-graphite/50">{item.sku}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-black/10 p-5">
              <Link href="/wishlist" onClick={() => setWishOpen(false)} className="flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white">
                {openWishlistText}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
