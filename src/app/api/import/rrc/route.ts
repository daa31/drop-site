import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        article: z.string().min(1),
        rrc: z.number().positive(),
      }),
    )
    .min(1)
    .max(10000),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", details: parsed.error.errors }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, supplierArticle: true, retailPrice: true },
    });
    const byKey = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      byKey.set(p.sku.toLowerCase(), p);
      byKey.set(p.supplierArticle.toLowerCase(), p);
    }

    const matched = [];
    const notFound: string[] = [];
    const errors: Array<{ article: string; rrc: number; reason: string }> = [];

    for (const item of parsed.data.items) {
      const key = item.article.trim().toLowerCase();
      const product = byKey.get(key);
      if (!product) {
        notFound.push(item.article.trim());
        continue;
      }
      if (!Number.isFinite(item.rrc) || item.rrc <= 0) {
        errors.push({ article: item.article.trim(), rrc: item.rrc, reason: "invalid price" });
        continue;
      }
      await prisma.$transaction([
        prisma.product.update({
          where: { id: product.id },
          data: { rrc: item.rrc, retailPrice: item.rrc },
        }),
        prisma.priceHistory.create({
          data: {
            productId: product.id,
            oldPrice: product.retailPrice,
            newPrice: item.rrc,
            source: "rrc",
          },
        }),
      ]);
      matched.push(item.article.trim());
    }

    return NextResponse.json({
      total: parsed.data.items.length,
      matched: matched.length,
      notFound,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "import failed" }, { status: 500 });
  }
}