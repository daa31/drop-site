import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function AdminHome() {
  const now = new Date();
  const startDay = new Date(now);
  startDay.setHours(0, 0, 0, 0);
  const week = new Date(startDay);
  week.setDate(week.getDate() - 7);
  const month = new Date(startDay);
  month.setDate(month.getDate() - 30);

  const [today, weekN, monthN, products, low, orders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startDay } } }),
    prisma.order.count({ where: { createdAt: { gte: week } } }),
    prisma.order.count({ where: { createdAt: { gte: month } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({ where: { stock: { lte: 3 }, isActive: true }, take: 8 }),
    prisma.order.findMany({ where: { createdAt: { gte: month } } }),
  ]);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const profit = orders.reduce((s, o) => s + o.profit, 0);
  const avg = orders.length ? revenue / orders.length : 0;

  const cards = [
    ["Замовлення сьогодні", today],
    ["За тиждень", weekN],
    ["За місяць", monthN],
    ["Товарів", products],
    ["Виручка", formatPrice(revenue)],
    ["Прибуток", formatPrice(profit)],
    ["Середній чек", formatPrice(avg)],
  ];

  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={String(k)} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="text-xs text-graphite/50">{k}</div>
            <div className="mt-2 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-medium">Товари закінчуються</h2>
      <div className="mt-3 rounded-2xl bg-white p-4 text-sm shadow-card">
        {low.map((p) => (
          <div key={p.id} className="flex justify-between border-b py-2">
            <span>{p.sku}</span>
            <span>{p.stock}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
