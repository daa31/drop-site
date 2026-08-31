import Link from "next/link";
import { ADMIN_COMMON_COPY, ADMIN_NAV_COPY, ADMIN_PRODUCTS_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { type Locale } from "@/lib/localization";
import { formatPrice, tJson } from "@/lib/utils";

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function p(key: keyof typeof ADMIN_PRODUCTS_COPY, locale: Locale) {
  return ADMIN_PRODUCTS_COPY[key][locale];
}

function margin(revenue: number, profit: number) {
  return revenue ? `${Math.round((profit / revenue) * 1000) / 10}%` : "-";
}

export default async function AdminProducts() {
  const locale = await getAdminLocale();
  const since30 = new Date();
  since30.setHours(0, 0, 0, 0);
  since30.setDate(since30.getDate() - 29);

  const [items, productCount] = await Promise.all([
    prisma.orderItem.findMany({
      include: { order: { select: { createdAt: true } } },
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const stats = new Map<string, { sold30: number; soldAll: number; revenue: number; profit: number }>();
  for (const item of items) {
    const row = stats.get(item.productId) || { sold30: 0, soldAll: 0, revenue: 0, profit: 0 };
    row.soldAll += item.qty;
    row.revenue += item.total;
    row.profit += item.total - item.supplierPrice * item.qty;
    if (item.order.createdAt >= since30) row.sold30 += item.qty;
    stats.set(item.productId, row);
  }

  const rankedProductIds = Array.from(stats.entries())
    .sort((a, b) => b[1].sold30 - a[1].sold30 || b[1].soldAll - a[1].soldAll || b[1].profit - a[1].profit)
    .slice(0, 100)
    .map(([productId]) => productId);

  const products = await prisma.product.findMany({
    where: rankedProductIds.length ? { id: { in: rankedProductIds }, isActive: true } : { isActive: true },
    include: { brand: true },
    orderBy: { updatedAt: "desc" },
    take: rankedProductIds.length ? undefined : 100,
  });

  const rows = products
    .map((product) => ({
      product,
      stat: stats.get(product.id) || { sold30: 0, soldAll: 0, revenue: 0, profit: 0 },
    }))
    .sort((a, b) => b.stat.sold30 - a.stat.sold30 || b.stat.soldAll - a.stat.soldAll || b.stat.profit - a.stat.profit);

  const totalSold30 = rows.reduce((sum, row) => sum + row.stat.sold30, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.stat.revenue, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.stat.profit, 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{p("title", locale)}</h1>
          <p className="mt-1 text-sm text-graphite/60">{p("subtitle", locale)}</p>
        </div>
        <Link href="/admin/import" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
          {ADMIN_NAV_COPY.import[locale]}
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{p("sold30", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{totalSold30}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{p("revenueProducts", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(totalRevenue, locale)}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{p("profitProducts", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(totalProfit, locale)}</div>
        </section>
      </div>
      <div className="text-sm text-graphite/55">
        {p("activeProductsPrefix", locale)} {productCount} {p("activeProductsSuffix", locale)}
      </div>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="px-5 py-3">{p("title", locale)}</th>
                <th className="py-3">{p("brand", locale)}</th>
                <th className="py-3">30</th>
                <th className="py-3">{p("allTime", locale)}</th>
                <th className="py-3">{c("revenue", locale)}</th>
                <th className="py-3">{c("profit", locale)}</th>
                <th className="py-3">{c("margin", locale)}</th>
                <th className="py-3">{p("supplier", locale)}</th>
                <th className="py-3 pr-5">{p("retail", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, stat }) => (
                <tr key={product.id} className="border-t border-black/5">
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${product.id}`} className="font-medium underline-offset-4 hover:underline">
                      {tJson(product.name, locale)}
                    </Link>
                    <div className="mt-0.5 text-xs text-graphite/50">{product.sku}</div>
                  </td>
                  <td className="py-3">{product.brand?.name || "-"}</td>
                  <td className="py-3 font-semibold">{stat.sold30}</td>
                  <td className="py-3">{stat.soldAll}</td>
                  <td className="py-3">{formatPrice(stat.revenue, locale)}</td>
                  <td className="py-3 font-semibold">{formatPrice(stat.profit, locale)}</td>
                  <td className="py-3">{margin(stat.revenue, stat.profit)}</td>
                  <td className="py-3">{formatPrice(product.supplierPrice, locale)}</td>
                  <td className="py-3 pr-5">{formatPrice(product.retailPrice, locale)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-sm text-graphite/55" colSpan={9}>
                    {p("empty", locale)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
