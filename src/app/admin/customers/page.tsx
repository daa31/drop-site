import { ADMIN_COMMON_COPY, ADMIN_CUSTOMERS_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { formatShortDate, type Locale } from "@/lib/localization";
import { formatPrice } from "@/lib/utils";

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function p(key: keyof typeof ADMIN_CUSTOMERS_COPY, locale: Locale) {
  return ADMIN_CUSTOMERS_COPY[key][locale];
}

function netProfit(order: { total: number; supplierCost: number; paymentFee: number; adSpend: number }) {
  return order.total - order.supplierCost - order.paymentFee - order.adSpend;
}

export default async function Customers() {
  const locale = await getAdminLocale();
  const customers = await prisma.customer.findMany({
    include: { orders: { select: { id: true, createdAt: true, total: true, supplierCost: true, paymentFee: true, adSpend: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = customers
    .map((customer) => {
      const revenue = customer.orders.reduce((sum, order) => sum + order.total, 0);
      const profit = customer.orders.reduce((sum, order) => sum + netProfit(order), 0);
      const lastOrder = customer.orders.reduce<Date | undefined>((last, order) => (!last || order.createdAt > last ? order.createdAt : last), undefined);
      return { customer, revenue, profit, lastOrder, orders: customer.orders.length };
    })
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl">{p("title", locale)}</h1>
        <p className="mt-1 text-sm text-graphite/60">{p("subtitle", locale)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{p("title", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{rows.length}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{c("revenue", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(totalRevenue, locale)}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{c("profit", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(totalProfit, locale)}</div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="px-5 py-3">{c("customer", locale)}</th>
                <th className="py-3">{p("contact", locale)}</th>
                <th className="py-3">{p("orders", locale)}</th>
                <th className="py-3">{c("revenue", locale)}</th>
                <th className="py-3">{c("profit", locale)}</th>
                <th className="py-3 pr-5">{p("lastOrder", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, orders, revenue, profit, lastOrder }) => (
                <tr key={customer.id} className="border-t border-black/5">
                  <td className="px-5 py-3">
                    <div className="font-medium">{customer.name}</div>
                    {customer.notes && <div className="mt-0.5 text-xs text-graphite/50">{customer.notes}</div>}
                  </td>
                  <td className="py-3">
                    <div>{customer.phone}</div>
                    <div className="text-xs text-graphite/50">{customer.email || p("emailMissing", locale)}</div>
                  </td>
                  <td className="py-3 font-semibold">{orders}</td>
                  <td className="py-3">{formatPrice(revenue, locale)}</td>
                  <td className="py-3 font-semibold">{formatPrice(profit, locale)}</td>
                  <td className="py-3 pr-5 text-graphite/55">{formatShortDate(lastOrder, locale)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-sm text-graphite/55" colSpan={6}>
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
