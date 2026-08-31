import { prisma } from "./db";

export async function notifyTelegram(text: string, extra?: { orderId?: string; phone?: string; orderUrl?: string }) {
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
          [{ text: "Відкрити замовлення", url: extra.orderUrl || `${site}/admin/orders/${extra.orderId}` }],
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

function deliveryLabel(value: string) {
  if (value === "nova_poshta_locker") return "Нова пошта, поштомат";
  if (value === "nova_poshta_branch") return "Нова пошта, відділення";
  return value === "nova_poshta" ? "Нова пошта" : value;
}

export function formatOrderTelegram(o: {
  number: number;
  name: string;
  phone: string;
  telegram?: string | null;
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
    o.telegram ? `Telegram:\n${o.telegram}` : "",
    `Товари:\n${o.items}`,
    `Сума:\n${Math.round(o.total)} грн`,
    `Доставка:\n${deliveryLabel(o.delivery)}`,
    o.city ? `Місто:\n${o.city}` : "",
    o.warehouse ? `Адреса:\n${o.warehouse}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
