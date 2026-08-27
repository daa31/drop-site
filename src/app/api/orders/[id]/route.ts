import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true } });
  if (!order) return NextResponse.json({ error: "nf" }, { status: 404 });
  if (session?.role !== "admin" && order.userId !== session?.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const publicOrder = {
    number: order.number,
    status: order.status,
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
