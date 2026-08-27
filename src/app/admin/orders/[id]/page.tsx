import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";

const STATUSES = [
  "new",
  "callback",
  "confirmed",
  "sent_to_supplier",
  "awaiting_shipment",
  "shipped",
  "received",
  "cancelled",
  "return",
];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });
  if (!o) notFound();
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl">Замовлення №{o.number}</h1>
      <p className="mt-2 text-sm">
        {o.customer?.name} · {o.customer?.phone} · {o.deliveryCity} · {o.warehouse}
      </p>
      <div className="mt-4 text-sm">
        Продаж {formatPrice(o.total)} · Закуп {formatPrice(o.supplierCost)} · Комісія {formatPrice(o.paymentFee)} ·
        Реклама {formatPrice(o.adSpend)} · Прибуток {formatPrice(o.profit)}
      </div>
      <ul className="mt-6 text-sm">
        {o.items.map((i) => (
          <li key={i.id}>
            {i.name} × {i.qty} — {formatPrice(i.total)} (закуп {formatPrice(i.supplierPrice)})
          </li>
        ))}
      </ul>
      <form
        className="mt-8 grid gap-3"
        action={async (fd) => {
          "use server";
          const status = String(fd.get("status"));
          await prisma.order.update({
            where: { id },
            data: {
              status,
              trackingNumber: String(fd.get("ttn") || ""),
              adminComment: String(fd.get("adminComment") || ""),
              adSpend: Number(fd.get("adSpend") || 0),
              statusHistory: { create: { from: o.status, to: status } },
            },
          });
        }}
      >
        <select name="status" defaultValue={o.status} className="rounded-xl border px-3 py-2">
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input name="ttn" placeholder="ТТН" defaultValue={o.trackingNumber || ""} className="rounded-xl border px-3 py-2" />
        <input name="adSpend" placeholder="Реклама" defaultValue={o.adSpend} className="rounded-xl border px-3 py-2" />
        <textarea name="adminComment" defaultValue={o.adminComment || ""} className="rounded-xl border px-3 py-2" />
        <button className="rounded-full bg-ink py-2 text-white">Оновити</button>
      </form>
      <h2 className="mt-8 font-medium">Історія</h2>
      <ul className="mt-2 text-xs text-graphite/60">
        {o.statusHistory.map((h) => (
          <li key={h.id}>
            {h.createdAt.toISOString()} {h.from} → {h.to}
          </li>
        ))}
      </ul>
    </div>
  );
}
