import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCart, setCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { formatOrderTelegram, notifyTelegram } from "@/lib/telegram";
import { tJson, publicSiteBase, requestBaseUrl } from "@/lib/utils";
import { siteSettings } from "@/lib/settings";
import { sendOrderNotificationEmail } from "@/lib/email";
import { normalizeLocale, orderStatusLabel } from "@/lib/localization";
import { isHoneypotFilled, HONEYPOT_NAME } from "@/lib/honeypot";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({
  name: z.string().min(2).max(80),
  surname: z.string().max(80).optional().or(z.literal("")),
  patronymic: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2),
  deliveryMethod: z.string().default("nova_poshta"),
  warehouse: z.string().min(1),
  telegram: z.string().max(80).optional().nullable(),
  noContact: z.boolean().optional().or(z.string()),
  paymentMethod: z.string().default("cod"),
  comment: z.string().max(500).optional(),
  locale: z.string().optional(),
  agree: z.literal(true).or(z.string()),
  turnstileToken: z.string().optional().nullable(),
  website: z.string().optional(),
});

function orderAdminUrl(req: NextRequest, settings: Record<string, string>, orderId: string) {
  const base = publicSiteBase(settings) || requestBaseUrl(req) || "http://localhost:3001";
  return new URL(`/admin/orders/${orderId}`, `${base}/`).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse({ ...body, agree: body.agree === true || body.agree === "on" });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    if (isHoneypotFilled(body)) {
      return NextResponse.json({ ok: true });
    }

    const realIp =
      req.headers.get("x-real-ip")?.trim() ||
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      undefined;
    const human = await verifyTurnstile(parsed.data.turnstileToken, realIp);
    if (!human) {
      return NextResponse.json({ error: "captcha" }, { status: 403 });
    }

    const telegram = parsed.data.telegram?.trim() || "";
    const noContact = parsed.data.noContact === true || parsed.data.noContact === "on";
    if (!noContact && !telegram) {
      return NextResponse.json({ error: "validation", fieldErrors: { telegram: ["required"] } }, { status: 400 });
    }

    const cart = await getCart();
    if (!cart.length) return NextResponse.json({ error: "empty_cart" }, { status: 400 });

    const products = await prisma.product.findMany({
      where: { id: { in: cart.map((c) => c.productId) }, isActive: true, stockStatus: "in_stock", stock: { gt: 0 } },
    });
    const map = Object.fromEntries(products.map((p) => [p.id, p]));
    const settings = await siteSettings();
    const feePct = Number(settings.payment_fee_pct || 0);
    const locale = normalizeLocale(parsed.data.locale);

    let subtotal = 0;
    let supplierCost = 0;
    const unique = new Map<string, { productId: string; name: string; sku: string; qty: number; unitPrice: number; supplierPrice: number; total: number }>();
    for (const c of cart) {
      const p = map[c.productId];
      if (!p) throw new Error("product_unavailable");
      const qty = Math.max(1, Math.min(99, Number(c.qty || 1)));
      const lineTotal = p.retailPrice * qty;
      const existing = unique.get(p.id);
      if (existing) {
        existing.qty += qty;
        existing.total += lineTotal;
      } else {
        unique.set(p.id, {
          productId: p.id,
          name: tJson(p.name, locale),
          sku: p.sku,
          qty,
          unitPrice: p.retailPrice,
          supplierPrice: p.supplierPrice,
          total: lineTotal,
        });
      }
      subtotal += lineTotal;
      supplierCost += p.supplierPrice * qty;
    }
    const items = Array.from(unique.values());

    const paymentFee = parsed.data.paymentMethod === "online" ? subtotal * (feePct / 100) : 0;
    const total = subtotal + paymentFee;
    const profit = total - supplierCost - paymentFee;

    const last = await prisma.order.findFirst({ orderBy: { number: "desc" } });
    const number = (last?.number || 1000) + 1;
    const session = await getSession();

    let userId: string | null = null;
    if (session?.uid) {
      const user = await prisma.user.findUnique({ where: { id: session.uid }, select: { id: true } });
      userId = user?.id ?? null;
    }

    const customer = await prisma.customer.create({
      data: {
        name: parsed.data.name,
        surname: parsed.data.surname || null,
        patronymic: parsed.data.patronymic || null,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        notes: telegram ? `Telegram: ${telegram}${noContact ? " (не турбувати)" : ""}` : noContact ? "Не зв'язуватись з клієнтом" : null,
      },
    });

    const publicToken = randomBytes(24).toString("base64url");

    const order = await prisma.order.create({
      data: {
        number,
        publicToken,
        userId,
        customerId: customer.id,
        status: "new",
        paymentStatus: parsed.data.paymentMethod === "online" ? "pending" : "cod",
        paymentMethod: parsed.data.paymentMethod,
        deliveryMethod: parsed.data.deliveryMethod,
        deliveryCity: parsed.data.city,
        warehouse: parsed.data.warehouse,
        comment: parsed.data.comment,
        subtotal,
        paymentFee,
        total,
        supplierCost,
        profit,
        locale,
        items: { create: items },
        statusHistory: { create: { to: "new", note: "created from storefront" } },
      },
      include: { customer: true, items: true },
    });

    await setCart([]);

    await prisma.auditLog.create({
      data: {
        actor: session?.email || parsed.data.phone,
        action: "create",
        entity: "order",
        payload: JSON.stringify({ orderId: order.id, number, total, items: items.length }).slice(0, 2000),
      },
    });

    const adminUrl = orderAdminUrl(req, settings, order.id);

    void (async () => {
      try {
        await notifyTelegram(
          formatOrderTelegram({
            number,
            name: [parsed.data.surname, parsed.data.name, parsed.data.patronymic].filter(Boolean).join(" "),
            phone: parsed.data.phone,
            telegram: noContact ? `${telegram} (не турбувати)` : telegram,
            items: items.map((i) => `${i.name} x ${i.qty}`).join("\n"),
            total,
            delivery: parsed.data.deliveryMethod,
            city: parsed.data.city,
            warehouse: parsed.data.warehouse,
          }),
          { orderId: order.id, phone: parsed.data.phone, orderUrl: adminUrl },
        );

        const emailResult = await sendOrderNotificationEmail({
          settings,
          order,
          adminUrl,
          noContact,
        });

        await prisma.notification.create({
          data: {
            channel: "email",
            title: `Order #${number}`,
            body: `Order #${number} received. Email notification: ${emailResult.message} Phone: ${parsed.data.phone}. Telegram: ${telegram || "-"}. City: ${parsed.data.city}. Warehouse: ${parsed.data.warehouse}.`,
            status: emailResult.status,
          },
        });
      } catch {
        await prisma.notification
          .create({
            data: {
              channel: "email",
              title: `Order #${number} (error)`,
              body: `Order #${number} received but email notification failed. Phone: ${parsed.data.phone}.`,
              status: "failed",
            },
          })
          .catch(() => {});
      }
    })();

    return NextResponse.json({ id: order.id, number, publicToken });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Order failed" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  const session = await getSession();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "nf" }, { status: 404 });
  if (session?.role !== "admin" && order.userId !== session?.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
    return NextResponse.json({
      number: order.number,
      status: order.status,
      statusLabel: orderStatusLabel(order.status, normalizeLocale(order.locale)),
      total: order.total,
      trackingNumber: order.trackingNumber,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, total: i.total })),
    });
}
