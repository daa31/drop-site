import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCart, setCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { formatOrderTelegram, notifyTelegram } from "@/lib/telegram";
import { tJson } from "@/lib/utils";
import { siteSettings } from "@/lib/settings";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2),
  deliveryMethod: z.string(),
  warehouse: z.string().optional(),
  paymentMethod: z.string(),
  comment: z.string().max(500).optional(),
  agree: z.literal(true).or(z.string()),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse({ ...body, agree: body.agree === true || body.agree === "on" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const cart = await getCart();
  if (!cart.length) return NextResponse.json({ error: "Empty cart" }, { status: 400 });

  const products = await prisma.product.findMany({ where: { id: { in: cart.map((c) => c.productId) } } });
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  const settings = await siteSettings();
  const feePct = Number(settings.payment_fee_pct || 0);

  let subtotal = 0;
  let supplierCost = 0;
  const items = cart.map((c) => {
    const p = map[c.productId];
    if (!p || p.stockStatus !== "in_stock") throw new Error("unavailable");
    const total = p.retailPrice * c.qty;
    subtotal += total;
    supplierCost += p.supplierPrice * c.qty;
    return {
      productId: p.id,
      name: tJson(p.name, "uk"),
      sku: p.sku,
      qty: c.qty,
      unitPrice: p.retailPrice,
      supplierPrice: p.supplierPrice,
      total,
    };
  });

  const paymentFee = parsed.data.paymentMethod === "online" ? subtotal * (feePct / 100) : 0;
  const total = subtotal;
  const profit = total - supplierCost - paymentFee;

  const last = await prisma.order.findFirst({ orderBy: { number: "desc" } });
  const number = (last?.number || 1000) + 1;
  const session = await getSession();

  const customer = await prisma.customer.create({
    data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null },
  });

  const order = await prisma.order.create({
    data: {
      number,
      userId: session?.uid,
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
      items: { create: items },
      statusHistory: { create: { to: "new", note: "created" } },
    },
  });

  await setCart([]);

  await notifyTelegram(
    formatOrderTelegram({
      number,
      name: parsed.data.name,
      phone: parsed.data.phone,
      items: items.map((i) => `${i.name} × ${i.qty}`).join("\n"),
      total,
      delivery: parsed.data.deliveryMethod,
      city: parsed.data.city,
      warehouse: parsed.data.warehouse,
    }),
    { orderId: order.id, phone: parsed.data.phone },
  );

  await prisma.notification.create({
    data: {
      channel: "email",
      title: `Замовлення №${number}`,
      body: `Ваше замовлення №${number} прийнято.`,
      status: "queued",
    },
  });

  return NextResponse.json({ id: order.id, number });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "nf" }, { status: 404 });
  return NextResponse.json({
    number: order.number,
    status: order.status,
    total: order.total,
    trackingNumber: order.trackingNumber,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, total: i.total })),
  });
}
