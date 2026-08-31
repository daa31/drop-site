import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { isHoneypotFilled } from "@/lib/honeypot";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (isHoneypotFilled(body)) {
    return NextResponse.json({ ok: true });
  }

  const realIp =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    undefined;
  const human = await verifyTurnstile(body.turnstileToken, realIp);
  if (!human) return NextResponse.json({ error: "captcha" }, { status: 403 });

  const parsed = z
    .object({
      productId: z.string(),
      authorName: z.string().min(2).max(60),
      rating: z.number().min(1).max(5),
      text: z.string().min(5).max(2000),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await prisma.review.create({ data: { ...parsed.data, status: "pending" } });
  return NextResponse.json({ ok: true });
}
