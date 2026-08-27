"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatPrice, tJson } from "@/lib/utils";

export type CardProduct = {
  id: string;
  slug: string;
  sku: string;
  name: unknown;
  brand?: string | null;
  retailPrice: number;
  oldPrice: number | null;
  discountPercent: number;
  stockStatus: string;
  stock: number;
  image?: string | null;
  isHit?: boolean;
  isNew?: boolean;
  isSale?: boolean;
};

export function ProductCard({ p, locale }: { p: CardProduct; locale: string }) {
  const t = useTranslations("product");
  const inStock = p.stockStatus === "in_stock" && p.stock > 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card">
      <Link href={`/product/${p.slug}`} className="relative aspect-square overflow-hidden bg-mist">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={tJson(p.name, locale)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-graphite/30">FORTIS</div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {p.discountPercent > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">−{p.discountPercent}%</span>
          )}
          {p.isHit && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">HIT</span>}
          {p.isNew && <span className="rounded-full bg-white px-2 py-0.5 text-[11px]">NEW</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] uppercase tracking-wide text-graphite/50">{p.brand}</div>
        <Link href={`/product/${p.slug}`} className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-medium leading-snug">
          {tJson(p.name, locale)}
        </Link>
        <div className="mt-1 text-xs text-graphite/50">
          {t("sku")}: {p.sku}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-base font-semibold">{formatPrice(p.retailPrice, locale)}</span>
          {p.oldPrice && <span className="text-sm text-graphite/40 line-through">{formatPrice(p.oldPrice, locale)}</span>}
        </div>
        <div className={`mt-1 text-xs ${inStock ? "text-emerald-700" : "text-graphite/50"}`}>
          {inStock ? t("inStock") : t("out")}
        </div>
        <form action={`/api/cart`} className="mt-auto pt-3">
          <div className="flex gap-2">
            <button
              formAction={async () => {
                await fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: undefined }),
                });
              }}
              type="button"
              disabled={!inStock}
              onClick={async () => {
                await fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: p.id, qty: 1 }),
                });
                window.location.reload();
              }}
              className="flex-1 rounded-full bg-ink py-2.5 text-sm text-white disabled:opacity-40"
            >
              {t("buy")}
            </button>
            <button
              type="button"
              onClick={() => {
                const raw = localStorage.getItem("fortis_wish") || "[]";
                const ids: string[] = JSON.parse(raw);
                const next = ids.includes(p.slug) ? ids.filter((x) => x !== p.slug) : [...ids, p.slug];
                localStorage.setItem("fortis_wish", JSON.stringify(next));
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10"
              aria-label={t("fav")}
            >
              <Heart size={16} />
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
