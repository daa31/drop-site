"use client";

import { useEffect, useState } from "react";
import { ProductCard, CardProduct } from "@/components/ProductCard";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const c = useTranslations("cart");
  const locale = useLocale();
  const [items, setItems] = useState<CardProduct[]>([]);
  useEffect(() => {
    const slugs: string[] = JSON.parse(localStorage.getItem("fortis_wish") || "[]");
    Promise.all(slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)))).then((rows) => {
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
  }, []);
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
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
