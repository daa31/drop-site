import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  await prisma.notification.create({
    data: {
      channel: "email",
      title: "Contact form",
      body: `${form.get("name")} ${form.get("email")}: ${form.get("message")}`,
    },
  });
  const referer = req.headers.get("referer") || "";
  const locale = referer.match(/^\/(uk|ru|en)(?:\/|$)/)?.[1] || "uk";
  return NextResponse.redirect(new URL(`/${locale}/contacts?sent=1`, req.nextUrl.origin), 303);
}
