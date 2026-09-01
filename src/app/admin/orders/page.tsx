import Link from "next/link";
import { Eye } from "lucide-react";
import { ADMIN_COMMON_COPY, ADMIN_ORDERS_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_ORDER, formatDateTime, orderStatusClass, orderStatusLabel, type Locale } from "@/lib/localization";
import { customerFullName } from "@/lib/email";

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function o(key: keyof typeof ADMIN_ORDERS_COPY, locale: Locale) {
  return ADMIN_ORDERS_COPY[key][locale];
}

function netProfit(order: { total: number; supplierCost: number; paymentFee: number; adSpend: number }) {
  return order.total - order.supplierCost - order.paymentFee - order.adSpend;
}

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const selectedStatus = typeof sp.status === "string" ? sp.status : "";
  const [orders, allOrders] = await Promise.all([
    prisma.order.findMany({
      where: selectedStatus ? { status: selectedStatus } : {},
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.order.findMany({ select: { status: true, total: true, supplierCost: true, paymentFee: true, adSpend: true } }),
  ]);

  const statusStats = new Map<string, { count: number; revenue: number; profit: number }>();
  for (const order of allOrders) {
    const item = statusStats.get(order.status) || { count: 0, revenue: 0, profit: 0 };
    item.count += 1;
    item.revenue += order.total;
    item.profit += netProfit(order);
    statusStats.set(order.status, item);
  }

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const profit = orders.reduce((sum, order) => sum + netProfit(order), 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{o("title", locale)}</h1>
          <p className="mt-1 text-sm text-graphite/60">{o("subtitle", locale)}</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-graphite/55">{o("inSelection", locale)}</span> <span className="font-semibold">{orders.length}</span>
          <span className="mx-2 text-graphite/30">/</span>
          <span className="font-semibold">{formatPrice(profit, locale)}</span> <span className="text-graphite/55">{c("profit", locale).toLowerCase()}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{c("revenue", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(revenue, locale)}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-graphite/45">{c("profit", locale)}</div>
          <div className="mt-2 text-2xl font-semibold">{formatPrice(profit, locale)}</div>
        </section>
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className={`rounded-lg px-3 py-2 text-sm ${!selectedStatus ? "bg-ink text-white" : "bg-mist text-graphite/70"}`}>
            {c("all", locale)}
          </Link>
          {ORDER_STATUS_ORDER.map((status) => {
            const item = statusStats.get(status);
            if (!item) return null;
            return (
              <Link key={status} href={`/admin/orders?status=${status}`} className={`rounded-lg px-3 py-2 text-sm ${selectedStatus === status ? "bg-ink text-white" : "bg-mist text-graphite/70"}`}>
                {orderStatusLabel(status, locale)} · {item.count}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="w-[100px] px-4 py-2.5">{c("order", locale)}</th>
                <th className="w-[190px] px-3 py-2.5">{c("customer", locale)}</th>
                <th className="px-3 py-2.5">{c("items", locale)}</th>
                <th className="w-[120px] px-3 py-2.5">{c("status", locale)}</th>
                <th className="w-[100px] px-3 py-2.5">{c("revenue", locale)}</th>
                <th className="w-[100px] px-3 py-2.5">{c("profit", locale)}</th>
                <th className="w-[110px] px-3 py-2.5">{c("date", locale)}</th>
                <th className="w-[100px] px-4 py-2.5 text-right">{c("action", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const orderProfit = netProfit(order);
                const itemQty = order.items.reduce((sum, item) => sum + item.qty, 0);
                return (
                  <tr key={order.id} className="border-t border-black/5 align-top">
                    <td className="px-4 py-2.5">
                      <Link className="font-semibold underline-offset-4 hover:underline" href={`/admin/orders/${order.id}`}>
                        #{order.number}
                      </Link>
                      {order.trackingNumber && <div className="mt-1 text-xs text-graphite/50">{c("ttn", locale)} {order.trackingNumber}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{customerFullName(order.customer)}</div>
                      <div className="text-xs text-graphite/50">{order.customer?.phone}</div>
                      {order.customer?.email && <div className="text-xs text-graphite/50">{order.customer.email}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div>{itemQty} {c("pcs", locale)}</div>
                      <div className="mt-0.5 line-clamp-2 text-xs text-graphite/55">{order.items.map((item) => item.name).join(", ")}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status, locale)}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatPrice(order.total, locale)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold">{formatPrice(orderProfit, locale)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-graphite/55">{formatDateTime(order.createdAt, locale, false)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/admin/orders/${order.id}`} data-order-view className="inline-flex h-8 items-center gap-2 rounded-lg bg-ink px-3 text-xs font-semibold text-white">
                        <Eye size={14} />
                        {c("view", locale)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-sm text-graphite/55" colSpan={8}>
                    {o("noStatusOrders", locale)}
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
