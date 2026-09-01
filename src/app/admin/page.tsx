import Link from "next/link";
import { ArrowRight, CircleDollarSign, PackageCheck, ReceiptText, TrendingUp } from "lucide-react";
import { ADMIN_COMMON_COPY, ADMIN_HOME_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { formatDateTime, orderStatusClass, orderStatusLabel, type Locale } from "@/lib/localization";
import { customerFullName } from "@/lib/email";

const PERIODS = [
  { id: "7", labelKey: "sevenDays", days: 7 },
  { id: "30", labelKey: "thirtyDays", days: 30 },
  { id: "90", labelKey: "ninetyDays", days: 90 },
  { id: "all", labelKey: "allTime", days: null },
] as const;

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function h(key: keyof typeof ADMIN_HOME_COPY, locale: Locale) {
  return ADMIN_HOME_COPY[key][locale];
}

function periodStart(period: (typeof PERIODS)[number]) {
  if (!period.days) return null;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - period.days + 1);
  return date;
}

function percent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function netProfit(order: { total: number; supplierCost: number; paymentFee: number; adSpend: number }) {
  return order.total - order.supplierCost - order.paymentFee - order.adSpend;
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const period = PERIODS.find((item) => item.id === sp.period) || PERIODS[1];
  const start = periodStart(period);
  const orderWhere = start ? { createdAt: { gte: start } } : {};

  const [orders, productCount, customerCount] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const profit = orders.reduce((sum, order) => sum + netProfit(order), 0);
  const avgOrder = orders.length ? revenue / orders.length : 0;
  const margin = revenue ? (profit / revenue) * 100 : 0;
  const soldQty = orders.reduce((sum, order) => sum + order.items.reduce((qty, item) => qty + item.qty, 0), 0);
  const activeOrders = orders.filter((order) => ["new", "callback", "confirmed", "sent_to_supplier", "awaiting_shipment"].includes(order.status)).length;

  const productStats = new Map<
    string,
    {
      name: string;
      sku: string;
      qty: number;
      orders: Set<string>;
      revenue: number;
      profit: number;
    }
  >();
  const customerStats = new Map<
    string,
    {
      name: string;
      phone: string;
      orders: number;
      revenue: number;
      profit: number;
      lastOrder: Date;
    }
  >();
  const statusStats = new Map<string, { count: number; revenue: number; profit: number }>();

  for (const order of orders) {
    const status = statusStats.get(order.status) || { count: 0, revenue: 0, profit: 0 };
    status.count += 1;
    status.revenue += order.total;
    status.profit += netProfit(order);
    statusStats.set(order.status, status);

    const customerKey = order.customerId || order.customer?.phone || order.id;
    const customer = customerStats.get(customerKey) || {
      name: customerFullName(order.customer),
      phone: order.customer?.phone || "",
      orders: 0,
      revenue: 0,
      profit: 0,
      lastOrder: order.createdAt,
    };
    customer.orders += 1;
    customer.revenue += order.total;
    customer.profit += netProfit(order);
    if (order.createdAt > customer.lastOrder) customer.lastOrder = order.createdAt;
    customerStats.set(customerKey, customer);

    for (const item of order.items) {
      const product = productStats.get(item.productId) || {
        name: item.name,
        sku: item.sku,
        qty: 0,
        orders: new Set<string>(),
        revenue: 0,
        profit: 0,
      };
      product.qty += item.qty;
      product.orders.add(order.id);
      product.revenue += item.total;
      product.profit += item.total - item.supplierPrice * item.qty;
      productStats.set(item.productId, product);
    }
  }

  const topProducts = Array.from(productStats.values()).sort((a, b) => b.qty - a.qty || b.profit - a.profit).slice(0, 8);
  const topCustomers = Array.from(customerStats.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const statuses = Array.from(statusStats.entries()).sort((a, b) => b[1].count - a[1].count);
  const recentOrders = orders.slice(0, 8);

  const kpis = [
    { label: c("revenue", locale), value: formatPrice(revenue, locale), note: `${orders.length} ${h("ordersWord", locale)}`, icon: CircleDollarSign },
    { label: c("profit", locale), value: formatPrice(profit, locale), note: `${c("margin", locale)} ${percent(margin)}`, icon: TrendingUp },
    { label: h("avgOrder", locale), value: formatPrice(avgOrder, locale), note: `${soldQty} ${h("productsSold", locale)}`, icon: ReceiptText },
    { label: h("active", locale), value: String(activeOrders), note: `${productCount} ${h("productsInCatalog", locale)}`, icon: PackageCheck },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{h("title", locale)}</h1>
          <p className="mt-1 text-sm text-graphite/60">{h("subtitle", locale)}</p>
        </div>
        <div className="flex rounded-lg border border-black/10 bg-white p-1 text-sm shadow-sm">
          {PERIODS.map((item) => (
            <Link key={item.id} href={`/admin?period=${item.id}`} className={`rounded-md px-3 py-2 ${item.id === period.id ? "bg-ink text-white" : "text-graphite/65 hover:bg-mist"}`}>
              {h(item.labelKey, locale)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.label} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-graphite/60">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-mist text-ink">
                  <Icon size={19} />
                </span>
              </div>
              <div className="mt-3 text-xs text-graphite/55">{item.note}</div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-6">
        <section className="rounded-lg border border-black/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <h2 className="font-semibold">{h("mostBought", locale)}</h2>
            <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm font-medium text-graphite/65 hover:text-ink">
              {h("products", locale)} <ArrowRight size={15} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
                <tr>
                  <th className="px-5 py-3">{h("products", locale)}</th>
                  <th className="py-3">{h("sold", locale)}</th>
                  <th className="py-3">{h("orders", locale)}</th>
                  <th className="py-3">{c("revenue", locale)}</th>
                  <th className="py-3 pr-5">{c("profit", locale)}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item) => (
                  <tr key={item.sku} className="border-t border-black/5">
                    <td className="px-5 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="mt-0.5 text-xs text-graphite/50">{item.sku}</div>
                    </td>
                    <td className="py-3 font-semibold">{item.qty}</td>
                    <td className="py-3">{item.orders.size}</td>
                    <td className="py-3">{formatPrice(item.revenue, locale)}</td>
                    <td className="py-3 pr-5">{formatPrice(item.profit, locale)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-sm text-graphite/55" colSpan={5}>
                      {h("noSales", locale)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{h("orderQueue", locale)}</h2>
          <div className="mt-4 grid gap-2">
            {statuses.map(([status, item]) => (
              <Link key={status} href={`/admin/orders?status=${status}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-black/10 px-3 py-2 hover:bg-mist">
                <span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs ${orderStatusClass(status)}`}>{orderStatusLabel(status, locale)}</span>
                  <span className="ml-2 text-xs text-graphite/50">{formatPrice(item.revenue, locale)}</span>
                </span>
                <span className="text-sm font-semibold">{item.count}</span>
              </Link>
            ))}
            {statuses.length === 0 && <div className="text-sm text-graphite/55">{c("noData", locale)}</div>}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{h("bestCustomers", locale)}</h2>
          <div className="mt-4 grid gap-3">
            {topCustomers.map((customer) => (
              <div key={`${customer.phone}-${customer.lastOrder.toISOString()}`} className="border-b border-black/5 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{customer.name}</div>
                    <div className="text-xs text-graphite/50">{customer.phone || h("noPhone", locale)}</div>
                  </div>
                  <div className="text-right text-sm font-semibold">{formatPrice(customer.revenue, locale)}</div>
                </div>
                <div className="mt-1 text-xs text-graphite/55">
                  {customer.orders} {h("ordersWord", locale)}, {c("profit", locale).toLowerCase()} {formatPrice(customer.profit, locale)}
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <div className="text-sm text-graphite/55">{c("noData", locale)}</div>}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{h("customerBase", locale)}</h2>
            <Link href="/admin/customers" className="text-sm font-medium text-graphite/65 hover:text-ink">
              {ADMIN_COMMON_COPY.all[locale]}
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-mist p-4">
              <div className="text-xs text-graphite/50">{h("customers", locale)}</div>
              <div className="mt-1 text-2xl font-semibold">{customerCount}</div>
            </div>
            <div className="rounded-lg bg-mist p-4">
              <div className="text-xs text-graphite/50">{h("products", locale)}</div>
              <div className="mt-1 text-2xl font-semibold">{productCount}</div>
            </div>
          </div>
          <Link href="/admin/orders" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white">
            {h("openOrders", locale)} <ArrowRight size={15} />
          </Link>
        </section>
      </div>

      <section className="rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="font-semibold">{h("latestOrders", locale)}</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-graphite/65 hover:text-ink">
            {h("allOrders", locale)} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="px-5 py-3">{c("order", locale)}</th>
                <th className="py-3">{c("customer", locale)}</th>
                <th className="py-3">{c("status", locale)}</th>
                <th className="py-3">{c("revenue", locale)}</th>
                <th className="py-3">{c("profit", locale)}</th>
                <th className="py-3 pr-5">{c("date", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-black/5">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold underline-offset-4 hover:underline">
                      #{order.number}
                    </Link>
                  </td>
                  <td className="py-3">
                    <div>{customerFullName(order.customer)}</div>
                    <div className="text-xs text-graphite/50">{order.customer?.phone}</div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status, locale)}</span>
                  </td>
                  <td className="py-3">{formatPrice(order.total, locale)}</td>
                  <td className="py-3">{formatPrice(netProfit(order), locale)}</td>
                  <td className="py-3 pr-5 text-graphite/55">{formatDateTime(order.createdAt, locale, false)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-sm text-graphite/55" colSpan={6}>
                    {h("noOrders", locale)}
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
