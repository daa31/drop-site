import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { OrderActionButton } from "@/components/OrderActionButton";
import { ADMIN_COMMON_COPY, ADMIN_ORDER_DETAIL_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { ORDER_STATUS_ORDER, formatDateTime, orderStatusLabel, type Locale } from "@/lib/localization";
import { customerFullName, sendOrderCancelledEmails } from "@/lib/email";
import { siteSettings } from "@/lib/settings";
import { publicSiteBase } from "@/lib/utils";

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function d(key: keyof typeof ADMIN_ORDER_DETAIL_COPY, locale: Locale) {
  return ADMIN_ORDER_DETAIL_COPY[key][locale];
}

function netProfit(order: { total: number; supplierCost: number; paymentFee: number; adSpend: number }) {
  return order.total - order.supplierCost - order.paymentFee - order.adSpend;
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getAdminLocale()]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const orderProfit = netProfit(order);

  return (
    <div className="grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{c("order", locale)} #{order.number}</h1>
          <p className="mt-1 text-sm text-graphite/60">
            {formatDateTime(order.createdAt, locale)} · {orderStatusLabel(order.status, locale)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="inline-flex h-10 items-center rounded-lg border border-black/10 bg-white px-4 text-sm">
            {c("backToOrders", locale)}
          </Link>
          <OrderActionButton
            orderId={order.id}
            redirectTo="/admin/orders"
            labels={{
              trigger: c("delete", locale),
              title: d("deleteTitle", locale),
              description: d("deleteText", locale),
              confirm: d("confirmDelete", locale),
              cancel: d("keep", locale),
              error: c("actionError", locale),
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section data-order-finance className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{d("clientDelivery", locale)}</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-graphite/45">{d("name", locale)}</div>
              <div className="font-medium">{customerFullName(order.customer)}</div>
            </div>
            <div>
              <div className="text-xs text-graphite/45">{d("phone", locale)}</div>
              <div className="font-medium">{order.customer?.phone || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-graphite/45">Email</div>
              <div>{order.customer?.email || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-graphite/45">Telegram</div>
              <div>{order.customer?.notes || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-graphite/45">{d("city", locale)}</div>
              <div>{order.deliveryCity || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-graphite/45">{d("warehouse", locale)}</div>
              <div>{order.warehouse || "-"}</div>
            </div>
          </div>
          {order.comment && (
            <div className="mt-4 rounded-lg bg-mist p-3 text-sm">
              <div className="text-xs text-graphite/45">{d("customerComment", locale)}</div>
              <div className="mt-1 whitespace-pre-wrap">{order.comment}</div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">{d("finances", locale)}</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-graphite/60">{d("total", locale)}</span>
              <span className="font-medium">{formatPrice(order.total, locale)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-graphite/60">{c("revenue", locale)}</span>
              <span className="font-medium">{formatPrice(order.subtotal, locale)}</span>
            </div>
            <div className="border-t border-black/10 pt-3">
              <div className="flex justify-between gap-3 text-base">
                <span className="font-medium">{c("profit", locale)}</span>
                <span className="font-semibold">{formatPrice(orderProfit, locale)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 px-5 py-4">
          <h2 className="font-semibold">{d("goods", locale)}</h2>
        </div>
        <div className="overflow-x-auto">
          <table data-order-items-table className="w-full min-w-[720px] table-fixed text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="w-[320px] px-5 py-3">{d("goods", locale)}</th>
                <th className="w-[140px] px-4 py-3">{d("sku", locale)}</th>
                <th className="w-[90px] px-4 py-3 text-right">{d("qty", locale)}</th>
                <th className="w-[130px] px-4 py-3 text-right">{d("price", locale)}</th>
                <th className="w-[140px] px-5 py-3 text-right">{d("sum", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-black/5">
                  <td className="px-5 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-graphite/60">{item.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{item.qty}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPrice(item.unitPrice, locale)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">{formatPrice(item.total, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{d("work", locale)}</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          action={async (fd) => {
            "use server";
            const status = String(fd.get("status"));
            const profit = netProfit(order);
            await prisma.order.update({
              where: { id },
              data: {
                status,
                trackingNumber: String(fd.get("ttn") || ""),
                adminComment: String(fd.get("adminComment") || ""),
                profit,
                statusHistory: status !== order.status ? { create: { from: order.status, to: status } } : undefined,
              },
            });
            if (status === "cancelled") {
              void (async () => {
                try {
                  const settings = await siteSettings();
                  const base = publicSiteBase(settings);
                  const adminUrl = `${base}/admin/orders/${id}`;
                  const fresh = await prisma.order.findUnique({ where: { id }, include: { customer: true, items: true } });
                  if (!fresh) return;
                  const result = await sendOrderCancelledEmails({ settings, order: fresh, adminUrl, source: "admin" });
                  await prisma.notification
                    .create({
                      data: {
                        channel: "email",
                        title: `Order #${fresh.number} cancelled`,
                        body: `Order #${fresh.number} cancelled by admin. Manager email: ${result.admin.message} Customer email: ${result.customer.message}`,
                        status: result.admin.status === "failed" || result.customer.status === "failed" ? "failed" : "sent",
                      },
                    })
                    .catch(() => {});
                } catch {
                  await prisma.notification
                    .create({ data: { channel: "email", title: `Order #${order.number} cancelled (email error)`, body: "Cancellation email failed.", status: "failed" } })
                    .catch(() => {});
                }
              })();
            }
            redirect(`/admin/orders/${id}`);
          }}
        >
          <label className="text-sm">
            {c("status", locale)}
            <select name="status" defaultValue={order.status} className="mt-1 w-full rounded-lg border px-3 py-2">
              {ORDER_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabel(status, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {c("ttn", locale)}
            <input name="ttn" placeholder={c("ttn", locale)} defaultValue={order.trackingNumber || ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm sm:col-span-2">
            {d("managerComment", locale)}
            <textarea name="adminComment" defaultValue={order.adminComment || ""} className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2" />
          </label>
          <button className="rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white sm:w-fit">{c("save", locale)}</button>
        </form>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{d("history", locale)}</h2>
        <div className="mt-3 grid gap-2 text-xs text-graphite/60">
          {order.statusHistory.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b border-black/5 pb-2 last:border-0 last:pb-0">
              <span>
                {item.from ? orderStatusLabel(item.from, locale) : "-"} {"->"} {orderStatusLabel(item.to, locale)}
              </span>
              <span>{formatDateTime(item.createdAt, locale)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
