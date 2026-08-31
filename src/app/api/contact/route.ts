import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestBaseUrl } from "@/lib/utils";

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
  let locale = "uk";
  try {
    locale = new URL(referer).pathname.match(/^\/(uk|ru|en)(?:\/|$)/)?.[1] || "uk";
  } catch {}
  return NextResponse.redirect(new URL(`/${locale}/contacts?sent=1`, `${requestBaseUrl(req)}/`), 303);
}
