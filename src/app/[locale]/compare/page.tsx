"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { tJson } from "@/lib/utils";

type P = { slug: string; name: unknown; retailPrice: number; brand?: { name: string }; attributes: Record<string, string> };

export default function ComparePage() {
  const locale = useLocale();
  const t = useTranslations("compare");
  const [items, setItems] = useState<P[]>([]);
  useEffect(() => {
    const slugs: string[] = JSON.parse(localStorage.getItem("fortis_compare") || "[]");
    Promise.all(slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)))).then((rows) =>
      setItems(rows.filter(Boolean)),
    );
  }, []);
  const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i.attributes || {}))));
  if (!items.length) return <div className="container-f py-20">{t("empty")}</div>;
  return (
    <div className="container-f overflow-x-auto py-10">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <table className="mt-8 min-w-[640px] w-full text-sm">
        <thead>
          <tr>
            <th />
            {items.map((i) => (
              <th key={i.slug} className="p-3 text-left">
                {tJson(i.name, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3 text-graphite/50">{locale === "en" ? "Price" : locale === "ru" ? "Цена" : "Ціна"}</td>
            {items.map((i) => (
              <td key={i.slug} className="p-3">{i.retailPrice}</td>
            ))}
          </tr>
          <tr className="border-t">
            <td className="p-3 text-graphite/50">{locale === "en" ? "Brand" : locale === "ru" ? "Бренд" : "Бренд"}</td>
            {items.map((i) => (
              <td key={i.slug} className="p-3">{i.brand?.name}</td>
            ))}
          </tr>
          {keys.map((k) => (
            <tr key={k} className="border-t">
              <td className="p-3 text-graphite/50">{k}</td>
              {items.map((i) => (
                <td key={i.slug} className="p-3">{i.attributes?.[k] || "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
