"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [err, setErr] = useState("");

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fd.get("name"),
            phone: fd.get("phone"),
            email: fd.get("email"),
            city: fd.get("city"),
            deliveryMethod: fd.get("deliveryMethod"),
            warehouse: fd.get("warehouse"),
            paymentMethod: fd.get("paymentMethod"),
            comment: fd.get("comment"),
            agree: fd.get("agree") === "on",
          }),
        });
        if (!res.ok) {
          setErr("Перевірте поля та наявність товарів у кошику");
          return;
        }
        const data = await res.json();
        router.push(`/checkout/success?n=${data.number}`);
      }}
    >
      <input name="name" required placeholder={t("name")} className="rounded-xl border px-4 py-3" />
      <input name="phone" required placeholder={t("phone")} className="rounded-xl border px-4 py-3" />
      <input name="email" type="email" placeholder={t("email")} className="rounded-xl border px-4 py-3" />
      <input name="city" required placeholder={t("city")} className="rounded-xl border px-4 py-3" />
      <select name="deliveryMethod" className="rounded-xl border px-4 py-3">
        <option value="nova_poshta">{t("np")}</option>
      </select>
      <input name="warehouse" placeholder={t("warehouse")} className="rounded-xl border px-4 py-3" />
      <select name="paymentMethod" className="rounded-xl border px-4 py-3">
        <option value="cod">{t("cod")}</option>
        <option value="online">{t("online")}</option>
      </select>
      <textarea name="comment" placeholder={t("comment")} className="rounded-xl border px-4 py-3" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agree" required className="mt-1" />
        {t("agree")}
      </label>
      {err && <p className="text-sm text-accent">{err}</p>}
      <button className="rounded-full bg-accent py-3 text-white">{t("submit")}</button>
    </form>
  );
}
