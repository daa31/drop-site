import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CUSTOMER_CANCELABLE_STATUSES, orderStatusLabel, normalizeLocale } from "@/lib/localization";
import { siteSettings } from "@/lib/settings";
import { sendOrderCancelledEmails } from "@/lib/email";
import { publicSiteBase, requestBaseUrl } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "nf" }, { status: 404 });
  if (session?.role !== "admin" && order.userId !== session?.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const locale = normalizeLocale(order.locale || undefined);
  const publicOrder = {
    number: order.number,
    status: order.status,
    statusLabel: orderStatusLabel(order.status, locale),
    total: order.total,
    trackingNumber: order.trackingNumber,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, total: i.total, sku: i.sku })),
    city: order.deliveryCity,
    warehouse: order.warehouse,
  };
  if (session?.role === "admin") {
    return NextResponse.json({
      ...publicOrder,
      supplierCost: order.supplierCost,
      profit: order.profit,
      customer: order.customer,
    });
  }
  return NextResponse.json(publicOrder);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "nf" }, { status: 404 });

  if (session.role === "admin") {
    const settings = await siteSettings();
    const base = publicSiteBase(settings) || requestBaseUrl(req) || "http://localhost:3001";
    const adminUrl = new URL(`/admin/orders/${id}`, `${base}/`).toString();
    const result = await sendOrderCancelledEmails({ settings, order, adminUrl, source: "admin" }).catch((e) => ({
      admin: { status: "failed" as const, message: String(e) },
      customer: { status: "failed" as const, message: String(e) },
    }));
    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          actor: session.email,
          action: "delete",
          entity: "order",
          payload: JSON.stringify({ orderId: id, number: order.number, total: order.total, items: order.items.length }).slice(0, 2000),
        },
      }),
      prisma.order.delete({ where: { id } }),
    ]);
    await prisma.notification
      .create({
        data: {
          channel: "email",
          title: `Order #${order.number} cancelled`,
          body: `Order #${order.number} cancelled by admin. Manager email: ${result.admin.message} Customer email: ${result.customer.message}`,
          status: result.admin.status === "failed" || result.customer.status === "failed" ? "failed" : "sent",
        },
      })
      .catch(() => {});
    return NextResponse.json({ ok: true, action: "deleted" });
  }

  if (order.userId !== session.uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (!CUSTOMER_CANCELABLE_STATUSES.includes(order.status as (typeof CUSTOMER_CANCELABLE_STATUSES)[number])) {
    return NextResponse.json({ error: "not_cancelable" }, { status: 409 });
  }

await prisma.order.update({
    where: { id },
    data: {
      status: "cancelled",
      profit: 0,
      statusHistory: { create: { from: order.status, to: "cancelled", note: "cancelled by customer" } },
    },
  });
  await prisma.auditLog.create({
    data: {
      actor: session.email,
      action: "cancel",
      entity: "order",
      payload: JSON.stringify({ orderId: id, number: order.number }).slice(0, 2000),
    },
  });

  void (async () => {
    try {
      const settings = await siteSettings();
      const base = publicSiteBase(settings) || requestBaseUrl(req) || "http://localhost:3001";
      const adminUrl = new URL(`/admin/orders/${id}`, `${base}/`).toString();
      const fresh = await prisma.order.findUnique({ where: { id }, include: { customer: true, items: true } });
      if (!fresh) return;
      const result = await sendOrderCancelledEmails({ settings, order: fresh, adminUrl });
      await prisma.notification
        .create({
          data: {
            channel: "email",
            title: `Order #${fresh.number} cancelled`,
            body: `Order #${fresh.number} cancelled by customer. Manager email: ${result.admin.message} Customer email: ${result.customer.message}`,
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

  return NextResponse.json({ ok: true, action: "cancelled" });
}
