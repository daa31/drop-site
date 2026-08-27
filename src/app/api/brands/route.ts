import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.brand.findMany();
  return NextResponse.json({ items });
}
