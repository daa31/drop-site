"use client";

import { useEffect, useState } from "react";
import { ProductCard, CardProduct } from "@/components/ProductCard";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { readWishlistSlugs, WISHLIST_EVENT } from "@/lib/wishlist";
import { Share2 } from "lucide-react";

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const c = useTranslations("cart");
  const locale = useLocale();
  const [items, setItems] = useState<CardProduct[]>([]);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let active = true;

    function load() {
      const slugs = readWishlistSlugs();
      Promise.all(slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)))).then((rows) => {
        if (!active) return;
        setItems(
          rows.filter(Boolean).map((p) => ({
            id: p.id,
            slug: p.slug,
            sku: p.sku,
            name: p.name,
            brand: p.brand?.name,
            retailPrice: p.retailPrice,
            oldPrice: p.oldPrice,
            discountPercent: p.discountPercent,
            stockStatus: p.stockStatus,
            stock: p.stock,
            image: p.images?.[0]?.url,
          })),
        );
      });
    }

    load();
    window.addEventListener(WISHLIST_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(WISHLIST_EVENT, load);
    };
  }, []);

  async function shareWishlist() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: "Locko — Обране", url });
    else await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  if (!items.length) {
    return (
      <div className="container-f py-20 text-center">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="mt-3">{t("empty")}</p>
        <Link href="/catalog" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-white">
          {c("toCatalog")}
        </Link>
      </div>
    );
  }
  return (
    <div className="container-f py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <button
          type="button"
          onClick={shareWishlist}
          className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition hover:border-ink"
        >
          <Share2 size={16} />
          {locale === "en" ? "Share" : locale === "ru" ? "Поделиться" : "Поділитися"}
          {shared && <span className="absolute -top-8 right-0 whitespace-nowrap rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-white">{locale === "en" ? "Copied!" : locale === "ru" ? "Скопійовано!" : "Скопійовано!"}</span>}
        </button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
