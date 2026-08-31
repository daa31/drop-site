"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { tJson } from "@/lib/utils";
import { readRecentSlugs, RECENT_EVENT } from "@/lib/recently";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Clock } from "lucide-react";

type P = { slug: string; name: unknown; retailPrice: number; brand?: { name: string } | null; images?: { url: string }[] };

export function RecentlyViewed() {
  const locale = useLocale();
  const t = useTranslations("home");
  const [items, setItems] = useState<P[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const slugs = readRecentSlugs(8);
      if (!slugs.length) {
        setItems([]);
        return;
      }
      const rows = await Promise.all(
        slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null))),
      );
      if (!cancelled) setItems(rows.filter(Boolean));
    }
    load();
    window.addEventListener(RECENT_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(RECENT_EVENT, load);
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="container-f mt-14">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-graphite/50" />
        <h2 className="font-display text-xl">{t("recentlyViewed")}</h2>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item.slug} href={`/product/${item.slug}`} className="group rounded-lg border border-black/10 bg-white p-3 shadow-card transition hover:shadow-md">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#eef0ed]">
              {item.images?.[0]?.url ? (
                <Image src={item.images[0].url} alt={tJson(item.name, locale)} fill sizes="300px" className="object-contain p-3 transition group-hover:scale-105" />
              ) : (
                <div className="grid h-full place-items-center text-graphite/30">Locko</div>
              )}
            </div>
            <div className="mt-3">
              <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{tJson(item.name, locale)}</div>
              <div className="mt-1 text-base font-semibold">{item.retailPrice} ₴</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
