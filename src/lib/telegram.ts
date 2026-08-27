import { prisma } from "./db";

export async function notifyTelegram(text: string, extra?: { orderId?: string; phone?: string }) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ||
    (await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } }))?.value;
  const chat =
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    (await prisma.setting.findUnique({ where: { key: "telegram_chat_id" } }))?.value;
  if (!token || !chat) return { ok: false, skipped: true };

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const reply_markup = extra?.orderId
    ? {
        inline_keyboard: [
          [{ text: "Відкрити замовлення", url: `${site}/admin/orders/${extra.orderId}` }],
          extra.phone ? [{ text: "Зателефонувати", url: `tel:${extra.phone}` }] : [],
        ].filter((r) => r.length),
      }
    : undefined;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text,
      reply_markup,
    }),
  });
  return { ok: res.ok };
}

export function formatOrderTelegram(o: {
  number: number;
  name: string;
  phone: string;
  items: string;
  total: number;
  delivery: string;
  city?: string | null;
  warehouse?: string | null;
}) {
  return [
    "НОВЕ ЗАМОВЛЕННЯ",
    `№ ${o.number}`,
    "",
    `Клієнт:\n${o.name}`,
    `Телефон:\n${o.phone}`,
    `Товари:\n${o.items}`,
    `Сума:\n${Math.round(o.total)} грн`,
    `Доставка:\n${o.delivery}`,
    o.city ? `Місто:\n${o.city}` : "",
    o.warehouse ? `Адреса:\n${o.warehouse}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
