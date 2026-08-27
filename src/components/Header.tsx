"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { tJson } from "@/lib/utils";

type Cat = { slug: string; name: unknown };

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
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hits, setHits] = useState<{ slug: string; name: string; sku: string }[]>([]);
  const path = usePathname();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

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
    }, 180);
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
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="container-f flex h-16 items-center gap-3 md:h-[72px]">
        <button className="lg:hidden p-2" aria-label={t("menu")} onClick={() => setMenu(true)}>
          <Menu size={22} />
        </button>
        <Link href="/" className="font-display text-xl tracking-[0.18em] font-semibold">
          FORTIS
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-sm lg:flex">
          <Link href="/catalog" className="font-medium">
            {t("catalog")}
          </Link>
          <Link href="/guide">{t("guide")}</Link>
          <Link href="/brands">{t("brands")}</Link>
        </nav>
        <div className="relative mx-auto hidden w-full max-w-md md:block" ref={box}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/catalog?q=${encodeURIComponent(q)}`);
              setOpen(false);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite/50" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-full border border-black/10 bg-mist py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ink"
            />
          </form>
          {open && hits.length > 0 && (
            <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-card">
              {hits.map((h) => (
                <Link
                  key={h.slug}
                  href={`/product/${h.slug}`}
                  className="block px-4 py-2.5 text-sm hover:bg-mist"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-graphite/60">{h.sku}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden text-xs font-medium sm:flex">
            {locales.map((l) => (
              <Link
                key={l.id}
                href={path}
                locale={l.id}
                className={`px-1.5 ${l.id === locale ? "text-ink" : "text-graphite/50"}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <Link href="/wishlist" className="hidden p-2 sm:block" aria-label={t("wishlist")}>
            <Heart size={20} />
          </Link>
          <Link href={user ? "/account" : "/login"} className="hidden p-2 sm:block" aria-label={t("account")}>
            <User size={20} />
          </Link>
          <Link href="/cart" className="relative p-2" aria-label={t("cart")}>
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">
                {cartCount}
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-full border border-black/10 bg-mist py-2.5 px-4 text-sm"
          />
        </form>
      </div>

      {menu && (
        <div className="fixed inset-0 z-[60] bg-ink/40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="h-full w-[86%] max-w-sm bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display tracking-[0.18em]">FORTIS</span>
              <button onClick={() => setMenu(false)}>
                <X />
              </button>
            </div>
            <div className="grid gap-3 text-sm">
              <Link href="/catalog" onClick={() => setMenu(false)}>
                {t("catalog")}
              </Link>
              {categories.map((c) => (
                <Link key={c.slug} href={`/catalog/${c.slug}`} onClick={() => setMenu(false)} className="text-graphite">
                  {tJson(c.name, locale)}
                </Link>
              ))}
              <Link href="/guide" onClick={() => setMenu(false)}>
                {t("guide")}
              </Link>
              <Link href="/brands">{t("brands")}</Link>
              <Link href="/delivery">{t("delivery")}</Link>
              <Link href="/contacts">{t("contacts")}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
