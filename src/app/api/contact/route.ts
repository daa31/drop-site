import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestBaseUrl } from "@/lib/utils";
import { siteSettings } from "@/lib/settings";
import { sendMail, type MailResult } from "@/lib/email";
import { isHoneypotFilled } from "@/lib/honeypot";
import { verifyTurnstile } from "@/lib/turnstile";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") body[key] = value;
  }

  if (isHoneypotFilled(body)) {
    return NextResponse.json({ ok: true });
  }

  const realIp =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    undefined;
  const human = await verifyTurnstile(body.turnstileToken, realIp);
  if (!human) return NextResponse.json({ error: "captcha" }, { status: 403 });

  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const message = String(form.get("message") || "").trim();

  const settings = await siteSettings();
  const to = (
    settings.order_notification_email ||
    process.env.ORDER_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ""
  ).trim();
  let emailResult: MailResult = { status: "skipped", message: "Recipient email is not configured." };
  if (to) {
    const user = (settings.smtp_user || process.env.SMTP_USER || "").trim();
    const from =
      (settings.smtp_from || process.env.SMTP_FROM || "").trim() ||
      (user ? `Locko <${user}>` : `Locko <${to}>`);
    emailResult = await sendMail({
      settings,
      from,
      to,
      replyTo: email || undefined,
      subject: "Contact form",
      text: `Name: ${name}\nEmail for reply: ${email}\n\n${message}`,
      html: `<p><b>Name:</b> ${escapeHtml(name)}<br/><b>${escapeHtml("Email for reply")}:</b> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    });
  }

  await prisma.notification.create({
    data: {
      channel: "email",
      title: "Contact form",
      body: `${name} ${email}: ${message} | email: ${emailResult.status} (${emailResult.message})`,
    },
  });

  const referer = req.headers.get("referer") || "";
  let locale = "uk";
  try {
    locale = new URL(referer).pathname.match(/^\/(uk|ru|en)(?:\/|$)/)?.[1] || "uk";
  } catch {}
  return NextResponse.redirect(new URL(`/${locale}/contacts?sent=1`, `${requestBaseUrl(req)}/`), 303);
}
