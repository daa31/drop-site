import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({
    where: { slug },
    include: { brand: true, images: true },
  });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { supplierPrice, minimumRetailPrice, ...publicP } = p;
  void supplierPrice;
  void minimumRetailPrice;
  return NextResponse.json({ ...publicP, id: p.id });
}
