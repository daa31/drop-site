"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CatalogControls({ brands }: { brands: { slug: string; name: string }[] }) {
  const t = useTranslations("catalog");
  const p = useTranslations("product");
  const sp = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function apply(form: FormData) {
    const next = new URLSearchParams(sp.toString());
    for (const key of ["q", "sort", "brand", "min", "max", "lens", "af", "photo", "polar", "rx", "il"]) {
      const v = String(form.get(key) || "");
      if (v) next.set(key, v);
      else next.delete(key);
    }
    next.delete("page");
    router.push(`?${next.toString()}`);
    setOpen(false);
  }

  const form = (
    <form
      className="space-y-4 text-sm"
      action={(fd) => apply(fd)}
    >
      <label className="block">
        <span className="mb-1 block text-graphite/60">{t("sort")}</span>
        <select name="sort" defaultValue={sp.get("sort") || "popular"} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2">
          <option value="popular">{t("popular")}</option>
          <option value="cheap">{t("cheap")}</option>
          <option value="expensive">{t("expensive")}</option>
          <option value="name">{t("name")}</option>
          <option value="new">{t("new")}</option>
          <option value="discount">{t("discount")}</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-graphite/60">{p("brand")}</span>
        <select name="brand" defaultValue={sp.get("brand") || ""} className="w-full rounded-xl border border-black/10 bg-white px-3 py-2">
          <option value="">—</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input name="min" placeholder="грн від" defaultValue={sp.get("min") || ""} className="rounded-xl border border-black/10 px-3 py-2" />
        <input name="max" placeholder="до" defaultValue={sp.get("max") || ""} className="rounded-xl border border-black/10 px-3 py-2" />
      </div>
      <input name="lens" placeholder="колір лінзи" defaultValue={sp.get("lens") || ""} className="w-full rounded-xl border border-black/10 px-3 py-2" />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="af" value="yes" defaultChecked={sp.get("af") === "yes"} /> Anti-Fog
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="photo" value="yes" defaultChecked={sp.get("photo") === "yes"} /> Photochromic
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="polar" value="yes" defaultChecked={sp.get("polar") === "yes"} /> Polarized
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="rx" value="yes" defaultChecked={sp.get("rx") === "yes"} /> Rx insert
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="il" value="yes" defaultChecked={sp.get("il") === "yes"} /> Interchangeable
      </label>
      <button className="w-full rounded-full bg-ink py-2.5 text-white">{t("apply")}</button>
      <button type="button" className="w-full text-graphite/60" onClick={() => router.push("?")}>
        {t("reset")}
      </button>
    </form>
  );

  return (
    <>
      <aside className="hidden h-fit rounded-2xl bg-white p-5 shadow-card lg:block">{form}</aside>
      <button
        className="fixed bottom-20 right-4 z-40 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-card lg:hidden"
        onClick={() => setOpen(true)}
      >
        {t("filters")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-lg font-medium">{t("filters")}</div>
            {form}
          </div>
        </div>
      )}
    </>
  );
}
