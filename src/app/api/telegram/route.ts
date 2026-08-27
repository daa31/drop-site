import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { notifyTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { text } = await req.json();
  const r = await notifyTelegram(text || "Тест FORTIS Telegram");
  return NextResponse.json(r);
}
