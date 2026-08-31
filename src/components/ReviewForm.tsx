"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { honeypotField, HONEYPOT_NAME } from "@/lib/honeypot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const COPY = {
  thanks: { uk: "Дякуємо. Відгук піде на модерацію.", ru: "Спасибо. Отзыв будет опубликован после модерации.", en: "Thank you! Your review will appear after moderation." },
  name: { uk: "Ім'я", ru: "Имя", en: "Name" },
  submit: { uk: "Надіслати", ru: "Отправить", en: "Send" },
};

function tr(o: Record<string, string>, locale: string) {
  return o[locale] || o.uk;
}

export function ReviewForm({ productId }: { productId: string }) {
  const locale = useLocale();
  const [ok, setOk] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const turnstileRequired = TURNSTILE_SITE_KEY.length > 0;
  if (ok) return <p className="mt-4 text-sm">{tr(COPY.thanks, locale)}</p>;
  return (
    <form
      className="mt-6 grid max-w-lg gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (turnstileRequired && !token) return;
        const fd = new FormData(e.currentTarget);
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            authorName: fd.get("name"),
            rating: Number(fd.get("rating")),
            text: fd.get("text"),
            [HONEYPOT_NAME]: fd.get(HONEYPOT_NAME) || "",
            turnstileToken: token,
          }),
        });
        setOk(true);
      }}
    >
      {honeypotField()}
      <input name="name" required placeholder={tr(COPY.name, locale)} className="rounded-xl border px-3 py-2" />
      <select name="rating" className="rounded-xl border px-3 py-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <textarea name="text" required className="rounded-xl border px-3 py-2" rows={4} />
      {turnstileRequired && <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onToken={setToken} />}
      <button type="submit" className="rounded-full bg-ink py-2 text-white">{tr(COPY.submit, locale)}</button>
    </form>
  );
}

