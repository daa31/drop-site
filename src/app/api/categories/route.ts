import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.category.findMany({
    where: { products: { some: { product: { isActive: true } } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ items });
}
