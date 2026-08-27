import { prisma } from "./db";

export async function siteSettings() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "FORTIS",
  default_margin_pct: "25",
  price_rounding: "99",
  phone: "+380 00 000 00 00",
  email: "hello@fortis.ua",
  telegram: "@fortis_support",
  hours: "Пн–Пт 09:00–18:00",
  ga_id: "",
  meta_pixel: "",
  tiktok_pixel: "",
  google_ads: "",
  np_api_key: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  payment_fee_pct: "2.2",
  delivery_info_uk: "Доставка Новою Поштою по Україні. Термін — зазвичай 1–3 робочі дні після підтвердження замовлення.",
  delivery_info_ru: "Доставка Новой Почтой по Украине. Срок — обычно 1–3 рабочих дня после подтверждения заказа.",
  delivery_info_en: "Nova Poshta delivery across Ukraine. Typically 1–3 business days after order confirmation.",
  payment_info_uk: "Оплата при отриманні або онлайн (LiqPay / WayForPay — після підключення ключів).",
  payment_info_ru: "Оплата при получении или онлайн (LiqPay / WayForPay — после подключения ключей).",
  payment_info_en: "Cash on delivery or online payment (LiqPay / WayForPay after keys are connected).",
  return_info_uk: "Повернення протягом 14 днів за умови збереження товарного вигляду. Індивідуальні замовлення — за окремими умовами.",
  return_info_ru: "Возврат в течение 14 дней при сохранении товарного вида.",
  return_info_en: "Returns within 14 days if the product is unused and in original condition.",
};
