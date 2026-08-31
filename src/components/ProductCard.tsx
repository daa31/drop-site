"use client";

import { Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { formatPrice, tJson } from "@/lib/utils";
import { readWishlistSlugs, toggleWishlistSlug, WISHLIST_EVENT } from "@/lib/wishlist";

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
  const canOrder = inStock;
  const name = tJson(p.name, locale);
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    function syncWishlistState() {
      setIsWished(readWishlistSlugs().includes(p.slug));
    }

    syncWishlistState();
    window.addEventListener(WISHLIST_EVENT, syncWishlistState);
    return () => window.removeEventListener(WISHLIST_EVENT, syncWishlistState);
  }, [p.slug]);

  function animateToCart(button: HTMLButtonElement) {
    const cart = document.querySelector<HTMLElement>("[data-cart-target]");
    if (!cart) return;

    const start = button.getBoundingClientRect();
    const end = cart.getBoundingClientRect();
    const drop = document.createElement("span");
    drop.className = "cart-drop";
    drop.style.left = `${start.left + start.width / 2}px`;
    drop.style.top = `${start.top + start.height / 2}px`;
    drop.style.setProperty("--cart-x", `${end.left + end.width / 2 - (start.left + start.width / 2)}px`);
    drop.style.setProperty("--cart-y", `${end.top + end.height / 2 - (start.top + start.height / 2)}px`);
    document.body.appendChild(drop);

    window.setTimeout(() => cart.classList.add("cart-bounce"), 520);
    window.setTimeout(() => {
      cart.classList.remove("cart-bounce");
      drop.remove();
    }, 900);
  }

  function animateToWishlist(button: HTMLButtonElement) {
    const target = document.querySelector<HTMLElement>("[data-wishlist-target]");
    if (!target) return;

    const start = button.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const drop = document.createElement("span");
    drop.className = "wish-drop";
    drop.style.left = `${start.left + start.width / 2}px`;
    drop.style.top = `${start.top + start.height / 2}px`;
    drop.style.setProperty("--cart-x", `${end.left + end.width / 2 - (start.left + start.width / 2)}px`);
    drop.style.setProperty("--cart-y", `${end.top + end.height / 2 - (start.top + start.height / 2)}px`);
    document.body.appendChild(drop);

    window.setTimeout(() => target.classList.add("cart-bounce"), 520);
    window.setTimeout(() => {
      target.classList.remove("cart-bounce");
      drop.remove();
    }, 900);
  }

  return (
    <article className={`group relative flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-card transition duration-300 ${canOrder ? "hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(17,18,20,0.12)]" : "grayscale opacity-60"}`}>
      <Link href={`/product/${p.slug}`} prefetch={false} className="relative aspect-square overflow-hidden bg-[#eef0ed]">
        {p.image ? (
          <Image
            src={p.image}
            alt={name}
            fill
            sizes="(min-width: 1280px) 24vw, (min-width: 640px) 45vw, 92vw"
            className="object-contain p-3 transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center text-graphite/30">Locko</div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.discountPercent > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">-{p.discountPercent}%</span>
          )}
          {p.isHit && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">HIT</span>}
          {p.isNew && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold">NEW</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wide text-graphite/50">
          <span className="truncate">{p.brand}</span>
          <span className={inStock ? "text-emerald-700" : "text-graphite/50"}>{inStock ? t("inStock") : t("out")}</span>
        </div>
        <Link href={`/product/${p.slug}`} prefetch={false} className="mt-2 line-clamp-2 min-h-[2.7em] text-sm font-semibold leading-snug">
          {name}
        </Link>
        <div className="mt-1 text-xs text-graphite/50">
          {t("sku")}: {p.sku}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-lg font-semibold">{formatPrice(p.retailPrice, locale)}</span>
          {p.oldPrice && <span className="text-sm text-graphite/40 line-through">{formatPrice(p.oldPrice, locale)}</span>}
        </div>

        <div className="mt-auto flex gap-2 pt-4">
          <button
            type="button"
            disabled={!canOrder}
            onClick={async (event) => {
              animateToCart(event.currentTarget);
              await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: p.id, qty: 1 }),
              });
              window.dispatchEvent(new CustomEvent("locko:cart-added", { detail: { qty: 1 } }));
            }}
            className="focus-ring flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-graphite/35 disabled:opacity-80"
          >
            <ShoppingBag size={16} />
            {canOrder ? t("add") : t("out")}
          </button>
          <button
            type="button"
            onClick={(event) => {
              const change = toggleWishlistSlug(p.slug);
              setIsWished(change.added);
              if (change.added) animateToWishlist(event.currentTarget);
            }}
            className={`focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border transition hover:border-ink hover:bg-mist ${
              isWished ? "border-red-500 bg-red-50 text-red-600" : "border-black/10"
            }`}
            aria-label={t("fav")}
            aria-pressed={isWished}
          >
            <Heart size={16} fill={isWished ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
