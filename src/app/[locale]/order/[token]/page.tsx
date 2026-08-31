import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrderActionButton } from "@/components/OrderActionButton";
import { prisma } from "@/lib/db";
import { ACCOUNT_COPY, CUSTOMER_CANCELABLE_STATUSES, normalizeLocale, orderStatusClass, orderStatusLabel, tr } from "@/lib/localization";
import { formatPrice } from "@/lib/utils";

export default async function PublicOrderPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: rawLocale, token } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "checkout" });

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        },
      },
    },
  });
  if (!order) notFound();

  const canCancel = CUSTOMER_CANCELABLE_STATUSES.includes(order.status as (typeof CUSTOMER_CANCELABLE_STATUSES)[number]);

  return (
    <div className="container-f py-10">
      <h1 className="font-display text-3xl">{t("publicTitle")}</h1>
      <section className="mt-4 rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-semibold">
            {tr(ACCOUNT_COPY.orderNumber, locale)} № {order.number}
          </div>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status, locale)}</span>
        </div>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-mist p-2">
              <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-white">
                {item.product.images[0]?.url ? (
                  <Image src={item.product.images[0].url} alt="" fill sizes="56px" className="object-contain p-1.5" />
                ) : (
                  <span className="text-[10px] font-semibold text-graphite/35">Locko</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-graphite/50">
                  {item.qty} × {formatPrice(item.unitPrice, locale)}
                </span>
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(item.total, locale)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
          <span className="text-sm text-graphite/60">{t("publicTotal")}</span>
          <span className="text-lg font-semibold">{formatPrice(order.total, locale)}</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-graphite/50">{t("publicDelivery")}: </span>
            <span className="font-medium">{order.deliveryCity || "-"}, {order.warehouse || "-"}</span>
          </div>
          {order.trackingNumber && (
            <div>
              <span className="text-graphite/50">{tr(ACCOUNT_COPY.tracking, locale)}: </span>
              <span className="font-medium">{order.trackingNumber}</span>
            </div>
          )}
        </div>
        {canCancel && (
          <div className="mt-5">
            <OrderActionButton
              orderId={order.id}
              tone="neutral"
              labels={{
                trigger: tr(ACCOUNT_COPY.cancel, locale),
                title: tr(ACCOUNT_COPY.cancelTitle, locale),
                description: tr(ACCOUNT_COPY.cancelText, locale),
                confirm: tr(ACCOUNT_COPY.confirmCancel, locale),
                cancel: tr(ACCOUNT_COPY.keep, locale),
                error: tr(ACCOUNT_COPY.actionError, locale),
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}