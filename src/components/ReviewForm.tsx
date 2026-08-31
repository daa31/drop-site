"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

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
  if (ok) return <p className="mt-4 text-sm">{tr(COPY.thanks, locale)}</p>;
  return (
    <form
      className="mt-6 grid max-w-lg gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            authorName: fd.get("name"),
            rating: Number(fd.get("rating")),
            text: fd.get("text"),
          }),
        });
        setOk(true);
      }}
    >
      <input name="name" required placeholder={tr(COPY.name, locale)} className="rounded-xl border px-3 py-2" />
      <select name="rating" className="rounded-xl border px-3 py-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <textarea name="text" required className="rounded-xl border px-3 py-2" rows={4} />
      <button type="submit" className="rounded-full bg-ink py-2 text-white">{tr(COPY.submit, locale)}</button>
    </form>
  );
}
