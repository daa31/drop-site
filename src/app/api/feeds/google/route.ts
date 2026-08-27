import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { brand: true, images: { take: 1 } },
  });
  const items = products.map((p) => ({
    id: p.sku,
    title: tJson(p.name, "uk"),
    description: tJson(p.shortDescription, "uk"),
    link: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${p.slug}`,
    image_link: p.images[0]?.url,
    price: `${Math.round(p.retailPrice)} UAH`,
    availability: p.stock > 0 ? "in stock" : "out of stock",
    brand: p.brand?.name,
    mpn: p.sku,
  }));
  return NextResponse.json({ items });
}
