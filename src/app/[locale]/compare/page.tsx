"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { tJson } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { setCompareSlug } from "@/lib/compare";
import { X } from "lucide-react";

type P = {
  slug: string;
  name: unknown;
  retailPrice: number;
  brand?: { name: string } | null;
  attributes: Record<string, string>;
  images?: { url: string }[];
};

const ATTR_KEYS: Record<string, { uk: string; ru: string; en: string }> = {
  lensColor: { uk: "Лінза", ru: "Линза", en: "Lens" },
  antiFog: { uk: "Антизапотівання", ru: "Антизапотевание", en: "Anti-Fog" },
  uv: { uk: "Захист UV", ru: "Защита UV", en: "UV Protection" },
  frameColor: { uk: "Оправа", ru: "Оправа", en: "Frame" },
  interchangeability: { uk: "Змінні лінзи", ru: "Сменные линзы", en: "Interchangeable" },
  weight: { uk: "Вага", ru: "Вес", en: "Weight" },
  certification: { uk: "Сертифікація", ru: "Сертификация", en: "Certification" },
};

const ATTR_VALUES: Record<string, { uk: string; ru: string; en: string }> = {
  "Прозрачный": { uk: "Прозора", ru: "Прозрачный", en: "Clear" },
  "Коричневый": { uk: "Бронзова", ru: "Коричневый", en: "Bronze" },
  "Серый": { uk: "Сіра", ru: "Серый", en: "Gray" },
  "Желтый": { uk: "Жовта", ru: "Желтый", en: "Yellow" },
  "Зеркальный": { uk: "Дзеркальна", ru: "Зеркальный", en: "Mirror" },
  "Затемненный": { uk: "Затемнена", ru: "Затемненный", en: "Dark" },
  "Затемнённый": { uk: "Затемнена", ru: "Затемнённый", en: "Dark" },
  "В оправе": { uk: "У оправі", ru: "В оправе", en: "In frame" },
  "Да": { uk: "Так", ru: "Да", en: "Yes" },
  "да": { uk: "так", ru: "да", en: "yes" },
  "Нет": { uk: "Ні", ru: "Нет", en: "No" },
  "нет": { uk: "ні", ru: "нет", en: "no" },
  "yes": { uk: "Так", ru: "Да", en: "Yes" },
  "no": { uk: "Ні", ru: "Нет", en: "No" },
  "UV400": { uk: "UV400", ru: "UV400", en: "UV400" },
  "Да, в комплекте": { uk: "Так, в комплекті", ru: "Да, в комплекте", en: "Yes, included" },
  "Нет, не в комплекте": { uk: "Ні, не в комплекті", ru: "Нет, не в комплекте", en: "No, not included" },
};

function trAttrKey(key: string, locale: string) {
  if (ATTR_KEYS[key]) return ATTR_KEYS[key][locale as "uk"] || ATTR_KEYS[key].uk;
  return key;
}

function trAttrValue(value: string, locale: string) {
  if (ATTR_VALUES[value]) return ATTR_VALUES[value][locale as "uk"] || ATTR_VALUES[value].uk;
  return value;
}

export default function ComparePage() {
  const locale = useLocale();
  const t = useTranslations("compare");
  const c = useTranslations("cart");
  const [items, setItems] = useState<P[]>([]);
  useEffect(() => {
    const slugs: string[] = JSON.parse(localStorage.getItem("fortis_compare") || "[]");
    Promise.all(slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)))).then((rows) =>
      setItems(rows.filter(Boolean)),
    );
  }, []);
  function removeItem(slug: string) {
    setCompareSlug(slug, false);
    setItems((current) => current.filter((item) => item.slug !== slug));
  }
  const keys = Array.from(new Set(items.flatMap((i) => Object.keys(i.attributes || {}))));
  if (!items.length)
    return (
      <div className="container-f flex flex-col items-center py-32 text-center">
        <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
        <p className="mt-4 text-lg text-graphite/60">{t("empty")}</p>
        <Link href="/catalog" className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-semibold text-white transition hover:bg-black">
          {c("toCatalog")}
        </Link>
      </div>
    );
  return (
    <div className="container-f overflow-x-auto py-10">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <table className="mt-8 min-w-[640px] w-full text-sm">
        <thead>
          <tr>
            <th />
            {items.map((i) => (
              <th key={i.slug} className="relative w-[200px] p-3 text-left">
                <Link href={`/product/${i.slug}`} className="block hover:opacity-80">
                  <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-[#eef0ed]">
                    {i.images?.[0]?.url ? (
                      <Image src={i.images[0].url} alt={tJson(i.name, locale)} fill sizes="200px" className="object-contain p-2" />
                    ) : (
                      <div className="grid h-full place-items-center text-graphite/30">Locko</div>
                    )}
                  </div>
                  <span className="text-sm font-semibold leading-snug">{tJson(i.name, locale)}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(i.slug)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black aria-label-viewport"
                  aria-label={t("remove")}
                >
                  <X size={16} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3 text-graphite/50">{locale === "en" ? "Price" : locale === "ru" ? "Цена" : "Ціна"}</td>
            {items.map((i) => (
              <td key={i.slug} className="p-3 font-semibold">{i.retailPrice} ₴</td>
            ))}
          </tr>
          <tr className="border-t">
            <td className="p-3 text-graphite/50">{locale === "en" ? "Brand" : locale === "ru" ? "Бренд" : "Бренд"}</td>
            {items.map((i) => (
              <td key={i.slug} className="p-3">{i.brand?.name || "—"}</td>
            ))}
          </tr>
          {keys.map((k) => (
            <tr key={k} className="border-t">
              <td className="p-3 text-graphite/50">{trAttrKey(k, locale)}</td>
              {items.map((i) => (
                <td key={i.slug} className="p-3">{i.attributes?.[k] ? trAttrValue(i.attributes[k], locale) : "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
