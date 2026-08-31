"use client";

import { Heart, Minus, Plus, Share2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { readWishlistSlugs, setWishlistSlug, WISHLIST_EVENT } from "@/lib/wishlist";

function fly(button: HTMLElement, targetSelector: string, className: string) {
  const target = document.querySelector<HTMLElement>(targetSelector);
  if (!target) return;
  const start = button.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const drop = document.createElement("span");
  drop.className = className;
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

export function ProductBuy({
  id,
  slug,
  unitPrice,
  locale,
  canOrder = true,
}: {
  id: string;
  slug: string;
  unitPrice: number;
  locale: string;
  canOrder?: boolean;
}) {
  const t = useTranslations("product");
  const [qty, setQty] = useState(1);
  const [shared, setShared] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  useEffect(() => {
    function syncWishlistState() {
      setIsWished(readWishlistSlugs().includes(slug));
    }

    syncWishlistState();
    window.addEventListener(WISHLIST_EVENT, syncWishlistState);
    return () => window.removeEventListener(WISHLIST_EVENT, syncWishlistState);
  }, [slug]);

  async function add() {
    if (!canOrder) return;
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, qty }),
    });
    window.dispatchEvent(new CustomEvent("locko:cart-added", { detail: { qty } }));
  }

  async function share() {
    void locale;
    void slug;
    const url = window.location.href;
    const title = document.title || "Locko";
    if (navigator.share) await navigator.share({ title, url });
    else await navigator.clipboard.writeText(url);
    setShared(true);
    window.setTimeout(() => setShared(false), 1600);
  }

  return (
    <div className="mt-8">
      <div className="mb-7 flex flex-wrap items-end gap-3">
        <span className="text-4xl font-semibold">{formatPrice(total, locale)}</span>
        {qty > 1 && <span className="pb-1 text-sm text-graphite/55">{formatPrice(unitPrice, locale)} / {t("oneItem")}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-graphite/60">{t("qty")}</span>
        <div className="flex h-11 items-center rounded-full border border-black/10 bg-white">
          <button type="button" className="grid h-11 w-11 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("decreaseQty")}>
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button type="button" className="grid h-11 w-11 place-items-center" onClick={() => setQty((q) => q + 1)} aria-label={t("increaseQty")}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="mt-5 hidden gap-3 lg:flex">
        <button
          type="button"
          disabled={!canOrder}
          onClick={async (event) => {
            fly(event.currentTarget, "[data-cart-target]", "cart-drop");
            await add();
          }}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-graphite/35"
        >
          <ShoppingBag size={17} />
          {canOrder ? t("add") : t("out")}
        </button>
        <button
          type="button"
          onClick={(event) => {
            fly(event.currentTarget, "[data-wishlist-target]", "wish-drop");
            const change = setWishlistSlug(slug, true);
            setIsWished(change.added);
          }}
          className={`grid h-12 w-12 place-items-center rounded-full border bg-white transition hover:border-red-500 hover:text-red-600 ${
            isWished ? "border-red-500 text-red-600" : "border-black/10"
          }`}
          aria-label={t("fav")}
          aria-pressed={isWished}
        >
          <Heart size={18} fill={isWished ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={share}
          className="relative grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white transition hover:border-ink"
          aria-label={t("share")}
        >
          <Share2 size={18} />
          {shared && <span className="absolute -bottom-7 whitespace-nowrap rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-white">{t("copied")}</span>}
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canOrder}
            onClick={async (event) => {
              fly(event.currentTarget, "[data-cart-target]", "cart-drop");
              await add();
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-graphite/35"
          >
            <ShoppingBag size={17} />
            {canOrder ? `${t("add")} - ${formatPrice(total, locale)}` : t("out")}
          </button>
          <button
            type="button"
            onClick={(event) => {
              fly(event.currentTarget, "[data-wishlist-target]", "wish-drop");
              const change = setWishlistSlug(slug, true);
              setIsWished(change.added);
            }}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border bg-white transition hover:border-red-500 hover:text-red-600 ${
              isWished ? "border-red-500 text-red-600" : "border-black/10"
            }`}
            aria-label={t("fav")}
            aria-pressed={isWished}
          >
            <Heart size={18} fill={isWished ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={share}
            className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-black/10 bg-white transition hover:border-ink"
            aria-label={t("share")}
          >
            <Share2 size={18} />
            {shared && <span className="absolute -top-8 whitespace-nowrap rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-white">{t("copied")}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
