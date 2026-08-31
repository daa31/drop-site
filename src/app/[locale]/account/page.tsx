import Image from "next/image";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { OrderActionButton } from "@/components/OrderActionButton";
import { ProfileField } from "@/components/ProfileField";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ACCOUNT_COPY, CUSTOMER_CANCELABLE_STATUSES, formatDateTime, normalizeLocale, orderStatusClass, orderStatusLabel, tr } from "@/lib/localization";
import { formatPrice } from "@/lib/utils";

function paymentLabel(method: string | null | undefined, locale: string) {
  const online = method === "online";
  if (locale === "ru") return online ? "Онлайн-оплата" : "Оплата при получении";
  if (locale === "en") return online ? "Online payment" : "Cash on delivery";
  return online ? "Онлайн-оплата" : "Оплата при отриманні";
}

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.uid }, select: { name: true, email: true, username: true, phone: true } }),
    prisma.order.findMany({
      where: { userId: session.uid },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="container-f py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{user?.name || session.name || tr(ACCOUNT_COPY.titleFallback, locale)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <LogoutButton label={tr(ACCOUNT_COPY.logout, locale)} />
          {session.role !== "admin" && (
            <DeleteAccountButton
              label={tr(ACCOUNT_COPY.deleteAccount, locale)}
              title={tr(ACCOUNT_COPY.deleteTitle, locale)}
              text={tr(ACCOUNT_COPY.deleteText, locale)}
              confirmLabel={tr(ACCOUNT_COPY.confirmDelete, locale)}
              cancelLabel={tr(ACCOUNT_COPY.cancelDelete, locale)}
              errorLabel={tr(ACCOUNT_COPY.deleteError, locale)}
            />
          )}
        </div>
      </div>
      <section className="mt-4 grid gap-2 rounded-lg border border-black/10 bg-white p-5 text-sm shadow-card sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-x-2">
        <ProfileField
          label="Email"
          value={user?.email}
          field="email"
          addTitle={tr(ACCOUNT_COPY.addData, locale)}
          editTitle={tr(ACCOUNT_COPY.editData, locale)}
          saveLabel={tr(ACCOUNT_COPY.save, locale)}
          cancelLabel={tr(ACCOUNT_COPY.cancel, locale)}
          saveErrorText={tr(ACCOUNT_COPY.saveError, locale)}
          invalidEmailText={tr(ACCOUNT_COPY.invalidEmail, locale)}
          invalidPhoneText={tr(ACCOUNT_COPY.invalidPhone, locale)}
          emailTakenText={tr(ACCOUNT_COPY.emailTaken, locale)}
          placeholder={tr(ACCOUNT_COPY.emailPlaceholder, locale)}
        />
        <span aria-hidden="true" className="hidden select-none text-graphite/35 sm:block">|</span>
        <div>
          <div className="text-xs uppercase tracking-wide text-graphite/45">{locale === "en" ? "Login" : "Логін"}</div>
          <div className="mt-1 min-w-0 truncate text-graphite/60">{user?.username || user?.email || "—"}</div>
        </div>
        <span aria-hidden="true" className="hidden select-none text-graphite/35 sm:block">|</span>
        <ProfileField
          label={locale === "en" ? "Phone" : "Телефон"}
          value={user?.phone}
          field="phone"
          addTitle={tr(ACCOUNT_COPY.addData, locale)}
          editTitle={tr(ACCOUNT_COPY.editData, locale)}
          saveLabel={tr(ACCOUNT_COPY.save, locale)}
          cancelLabel={tr(ACCOUNT_COPY.cancel, locale)}
          saveErrorText={tr(ACCOUNT_COPY.saveError, locale)}
          invalidEmailText={tr(ACCOUNT_COPY.invalidEmail, locale)}
          invalidPhoneText={tr(ACCOUNT_COPY.invalidPhone, locale)}
          emailTakenText={tr(ACCOUNT_COPY.emailTaken, locale)}
          placeholder={tr(ACCOUNT_COPY.phonePlaceholder, locale)}
        />
      </section>
      <h2 className="mt-10 font-medium">{tr(ACCOUNT_COPY.orders, locale)}</h2>
      <div className="mt-4 grid gap-3">
        {orders.length === 0 && <p className="text-sm text-graphite/60">{tr(ACCOUNT_COPY.emptyOrders, locale)}</p>}
        {orders.map((order) => {
          const canCancel = CUSTOMER_CANCELABLE_STATUSES.includes(order.status as (typeof CUSTOMER_CANCELABLE_STATUSES)[number]);
          return (
            <section key={order.id} className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {tr(ACCOUNT_COPY.orderNumber, locale)} № {order.number}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-graphite/60">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status, locale)}</span>
                    <span>{formatPrice(order.total, locale)}</span>
                    <span>{formatDateTime(order.createdAt, locale)}</span>
                    <span>
                      {tr(ACCOUNT_COPY.payment, locale)}: {paymentLabel(order.paymentMethod, locale)}
                    </span>
                    {order.trackingNumber && <span>{tr(ACCOUNT_COPY.tracking, locale)} {order.trackingNumber}</span>}
                  </div>
                </div>
                {canCancel && (
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
                )}
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
            </section>
          );
        })}
      </div>
    </div>
  );
}
