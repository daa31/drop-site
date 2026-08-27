import { NextRequest, NextResponse } from "next/server";
import { addToCart, getCart, setCart, updateCartQty } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";

export async function GET() {
  const items = await getCart();
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { images: { take: 1 } },
  });
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  const detailed = items
    .map((i) => {
      const p = map[i.productId];
      if (!p) return null;
      return {
        productId: i.productId,
        qty: i.qty,
        slug: p.slug,
        sku: p.sku,
        name: tJson(p.name, "uk"),
        price: p.retailPrice,
        image: p.images[0]?.url,
        stockStatus: p.stockStatus,
      };
    })
    .filter(Boolean);
  return NextResponse.json({ items: detailed });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.productId) await addToCart(body.productId, Number(body.qty || 1));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await updateCartQty(body.productId, Number(body.qty));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const items = await getCart();
  await setCart(items.filter((i) => i.productId !== body.productId));
  return NextResponse.json({ ok: true });
}
