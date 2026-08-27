"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { tJson } from "@/lib/utils";

export function CatalogControls({
  brands,
  categories,
  currentCategory,
  locale,
}: {
  brands: { slug: string; name: string }[];
  categories: { slug: string; name: unknown }[];
  currentCategory?: string;
  locale: string;
}) {
  const t = useTranslations("catalog");
  const p = useTranslations("product");
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function apply(form: FormData) {
    const next = new URLSearchParams(sp.toString());
    const category = String(form.get("category") || "");
    for (const key of ["q", "sort", "brand", "min", "max", "lens", "af", "photo", "polar", "rx", "il"]) {
      const v = String(form.get(key) || "");
      if (v) next.set(key, v);
      else next.delete(key);
    }
    next.delete("category");
    next.delete("page");
    const query = next.toString();
    router.push(`${category ? `/catalog/${category}` : "/catalog"}${query ? `?${query}` : ""}`);
    setOpen(false);
  }

  const inputClass = "h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-ink";

  const form = (
    <form className="space-y-5 text-sm" action={(fd) => apply(fd)}>
      <div>
        <span className="mb-2 block text-xs uppercase tracking-wide text-graphite/45">{t("category")}</span>
        <select name="category" defaultValue={currentCategory || ""} className={inputClass}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {tJson(c.name, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-wide text-graphite/45">{t("sort")}</span>
        <select name="sort" defaultValue={sp.get("sort") || "popular"} className={inputClass}>
          <option value="popular">{t("popular")}</option>
          <option value="cheap">{t("cheap")}</option>
          <option value="expensive">{t("expensive")}</option>
          <option value="name">{t("name")}</option>
          <option value="new">{t("new")}</option>
          <option value="discount">{t("discount")}</option>
        </select>
      </div>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-wide text-graphite/45">{p("brand")}</span>
        <select name="brand" defaultValue={sp.get("brand") || ""} className={inputClass}>
          <option value="">{t("allBrands")}</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-wide text-graphite/45">{t("price")}</span>
        <div className="grid grid-cols-2 gap-2">
          <input name="min" placeholder={t("from")} defaultValue={sp.get("min") || ""} className={inputClass} />
          <input name="max" placeholder={t("to")} defaultValue={sp.get("max") || ""} className={inputClass} />
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs uppercase tracking-wide text-graphite/45">{t("lens")}</span>
        <select name="lens" defaultValue={sp.get("lens") || ""} className={inputClass}>
          <option value="">{t("allLenses")}</option>
          <option value="clear">{t("lensClear")}</option>
          <option value="gray">{t("lensGray")}</option>
          <option value="bronze">{t("lensBronze")}</option>
          <option value="yellow">{t("lensYellow")}</option>
          <option value="mirror">{t("lensMirror")}</option>
          <option value="dark">{t("lensDark")}</option>
        </select>
      </div>

      <div className="grid gap-2">
        {[
          ["af", t("antiFog")],
          ["photo", t("photochromic")],
          ["polar", t("polarized")],
          ["rx", t("rxInsert")],
          ["il", t("interchangeable")],
        ].map(([name, label]) => (
          <label key={name} className="flex h-11 items-center justify-between rounded-lg border border-black/10 bg-white px-3">
            <span>{label}</span>
            <input type="checkbox" name={name} value="yes" defaultChecked={sp.get(name) === "yes"} className="h-4 w-4 accent-black" />
          </label>
        ))}
      </div>

      <button className="flex h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-white">{t("apply")}</button>
      <button type="button" className="h-10 w-full rounded-full text-sm font-medium text-graphite/60 hover:bg-white" onClick={() => router.push("/catalog")}>
        {t("reset")}
      </button>
    </form>
  );

  return (
    <>
      <aside className="hidden h-fit rounded-lg border border-black/10 bg-[#f8f8f6] p-5 shadow-card lg:block">
        <div className="mb-5 flex items-center gap-2">
          <SlidersHorizontal size={18} />
          <div className="font-semibold">{t("filters")}</div>
        </div>
        {form}
      </aside>

      <button className="fixed bottom-20 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white shadow-card lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal size={17} />
        {t("filters")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/45 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-[#f8f8f6] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal size={18} />
                {t("filters")}
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setOpen(false)} aria-label={t("closeFilters")}>
                <X size={18} />
              </button>
            </div>
            {form}
          </div>
        </div>
      )}
    </>
  );
}
