"use client";

import { formatPrice } from "@/lib/utils";
import { Link } from "@/i18n/routing";

export function CartClient({
  rows,
  locale,
  totalLabel,
}: {
  rows: { productId: string; qty: number; slug: string; name: string; price: number; image?: string }[];
  locale: string;
  totalLabel: string;
}) {
  void totalLabel;
  return (
    <div className="mt-8 divide-y rounded-2xl bg-white shadow-card">
      {rows.map((r) => (
        <div key={r.productId} className="flex gap-4 p-4">
          {r.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
          )}
          <div className="flex-1">
            <Link href={`/product/${r.slug}`} className="font-medium">
              {r.name}
            </Link>
            <div className="mt-1 text-sm">{formatPrice(r.price, locale)}</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="h-8 w-8 rounded-full border"
                onClick={async () => {
                  await fetch("/api/cart", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: r.productId, qty: r.qty - 1 }),
                  });
                  location.reload();
                }}
              >
                −
              </button>
              <span>{r.qty}</span>
              <button
                className="h-8 w-8 rounded-full border"
                onClick={async () => {
                  await fetch("/api/cart", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: r.productId, qty: r.qty + 1 }),
                  });
                  location.reload();
                }}
              >
                +
              </button>
              <button
                className="ml-4 text-sm text-graphite/50"
                onClick={async () => {
                  await fetch("/api/cart", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: r.productId }),
                  });
                  location.reload();
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
