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
  return NextResponse.redirect(new URL("/contacts", req.url));
}
