import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const provider = req.nextUrl.searchParams.get("provider") || "generic";
  if (body.orderId && (body.status === "paid" || body.payment_status === "success")) {
    await prisma.order.update({
      where: { id: body.orderId },
      data: { paymentStatus: "paid", status: "confirmed" },
    });
  }
  await prisma.auditLog.create({
    data: { actor: "webhook", action: "payment", entity: provider, payload: JSON.stringify(body).slice(0, 2000) },
  });
  return NextResponse.json({ ok: true });
}
