"use client";

import { useState } from "react";

export function ReviewForm({ productId }: { productId: string }) {
  const [ok, setOk] = useState(false);
  if (ok) return <p className="mt-4 text-sm">Дякуємо. Відгук піде на модерацію.</p>;
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
      <input name="name" required placeholder="Ім’я" className="rounded-xl border px-3 py-2" />
      <select name="rating" className="rounded-xl border px-3 py-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <textarea name="text" required className="rounded-xl border px-3 py-2" rows={4} />
      <button className="rounded-full bg-ink py-2 text-white">Надіслати</button>
    </form>
  );
}
