import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function Orders() {
  const orders = await prisma.order.findMany({ include: { customer: true, items: true }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl">Замовлення</h1>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">№</th>
            <th>Клієнт</th>
            <th>Сума</th>
            <th>Закуп</th>
            <th>Прибуток</th>
            <th>Статус</th>
            <th>ТТН</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2">
                <Link className="underline" href={`/admin/orders/${o.id}`}>
                  {o.number}
                </Link>
              </td>
              <td>
                {o.customer?.name}
                <div className="text-xs text-graphite/50">{o.customer?.phone}</div>
              </td>
              <td>{formatPrice(o.total)}</td>
              <td>{formatPrice(o.supplierCost)}</td>
              <td>{formatPrice(o.profit)}</td>
              <td>{o.status}</td>
              <td>{o.trackingNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
