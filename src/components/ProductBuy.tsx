"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

export function ProductBuy({ id, slug, inStock }: { id: string; slug: string; inStock: boolean }) {
  const t = useTranslations("product");
  const router = useRouter();
  const [qty, setQty] = useState(1);

  async function add() {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, qty }),
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <span className="text-sm text-graphite/60">{t("qty")}</span>
        <button className="h-10 w-10 rounded-full border" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <span className="w-6 text-center">{qty}</span>
        <button className="h-10 w-10 rounded-full border" onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>
      <div className="mt-5 hidden gap-3 lg:flex">
        <button
          disabled={!inStock}
          onClick={async () => {
            await add();
            router.push("/checkout");
          }}
          className="rounded-full bg-accent px-8 py-3 text-white disabled:opacity-40"
        >
          {t("buy")}
        </button>
        <button disabled={!inStock} onClick={add} className="rounded-full bg-ink px-8 py-3 text-white disabled:opacity-40">
          {t("add")}
        </button>
        <button
          onClick={() => {
            const raw = JSON.parse(localStorage.getItem("fortis_wish") || "[]");
            localStorage.setItem("fortis_wish", JSON.stringify(Array.from(new Set([...raw, slug]))));
          }}
          className="rounded-full border px-6 py-3"
        >
          {t("fav")}
        </button>
        <button
          onClick={() => {
            const raw = JSON.parse(localStorage.getItem("fortis_compare") || "[]");
            const next = Array.from(new Set([...raw, slug])).slice(0, 4);
            localStorage.setItem("fortis_compare", JSON.stringify(next));
          }}
          className="rounded-full border px-6 py-3"
        >
          {t("compare")}
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-3 lg:hidden">
        <button
          disabled={!inStock}
          onClick={async () => {
            await add();
            router.push("/checkout");
          }}
          className="w-full rounded-full bg-accent py-3 text-white disabled:opacity-40"
        >
          {inStock ? t("buy") : t("out")}
        </button>
      </div>
    </div>
  );
}
