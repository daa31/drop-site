"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ProductCard, CardProduct } from "@/components/ProductCard";

export default function GuidePage() {
  const t = useTranslations("guide");
  const [step, setStep] = useState(0);
  const [a, setA] = useState({ use: "", lens: "", af: "", rx: "" });
  const [items, setItems] = useState<CardProduct[]>([]);

  const questions = useMemo(
    () => [
      { key: "use", title: t("q1"), opts: ["work", "auto", "moto", "sport", "tourism", "tactical", "shooting", "industry"] },
      { key: "lens", title: t("q2"), opts: ["clear", "dark", "yellow", "photo", "polar", "unknown"] },
      { key: "af", title: t("q3"), opts: ["yes", "no", "unknown"] },
      { key: "rx", title: t("q4"), opts: ["yes", "no"] },
    ],
    [t],
  );

  async function finish(next: typeof a) {
    const params = new URLSearchParams();
    if (next.lens === "clear") params.set("lens", "clear");
    if (next.lens === "dark") params.set("lens", "gray");
    if (next.lens === "yellow") params.set("lens", "amber");
    if (next.lens === "photo") params.set("photo", "yes");
    if (next.lens === "polar") params.set("polar", "yes");
    if (next.af === "yes") params.set("af", "yes");
    if (next.rx === "yes") params.set("rx", "yes");
    if (next.use === "tactical" || next.use === "shooting") params.set("category", "taktychni-okuliary");
    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setItems(data.items || []);
    setStep(4);
  }

  if (step === 4) {
    return (
      <div className="container-f py-10">
        <h1 className="font-display text-3xl">{t("result")}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} locale="uk" />
          ))}
        </div>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div className="container-f max-w-2xl py-16">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p className="mt-8 text-lg">{q.title}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {q.opts.map((o) => (
          <button
            key={o}
            className="rounded-2xl bg-white p-4 text-left shadow-card"
            onClick={() => {
              const next = { ...a, [q.key]: o };
              setA(next);
              if (step === 3) finish(next);
              else setStep(step + 1);
            }}
          >
            {t(o as "work")}
          </button>
        ))}
      </div>
    </div>
  );
}
