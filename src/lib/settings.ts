import { prisma } from "./db";

export async function siteSettings() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "Locko",
  default_margin_pct: "25",
  price_rounding: "99",
  phone: "+380 00 000 00 00",
  email: "hello@fortis.ua",
  telegram: "@fortis_support",
  hours: "Пн-Пт 09:00-18:00",
  ga_id: "",
  meta_pixel: "",
  tiktok_pixel: "",
  google_ads: "",
  np_api_key: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  payment_fee_pct: "2.2",
  feed_uabest_url:
    "https://uabest.com.ua/content/export/f3c3a6750fc5783821bd896ea6f5dba3.xml",
  feed_pyramex_url:
    "https://pyramex.prom.ua/products_feed.xml?hash_tag=1459a430d257d2f7076e1ad08d2fb397&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&group_ids=100547263%2C100547264%2C100547266%2C110964000%2C114098108%2C114098109%2C114098110%2C114098111%2C114098112%2C114098113%2C114098114&nested_group_ids=100547264%2C100547266%2C110964000%2C114098108%2C114098109%2C114098110%2C114098111%2C114098112%2C114098113%2C114098114",
  last_feed_sync_at: "",
  delivery_info_uk:
    "Доставка Новою Поштою по Україні. Зазвичай 1-3 робочі дні після підтвердження замовлення.",
  delivery_info_ru:
    "Доставка Новой Почтой по Украине. Обычно 1-3 рабочих дня после подтверждения заказа.",
  delivery_info_en:
    "Nova Poshta delivery across Ukraine. Typically 1-3 business days after order confirmation.",
  payment_info_uk:
    "Оплата при отриманні або онлайн після підключення LiqPay / WayForPay.",
  payment_info_ru:
    "Оплата при получении или онлайн после подключения LiqPay / WayForPay.",
  payment_info_en:
    "Cash on delivery or online payment after LiqPay / WayForPay keys are connected.",
  return_info_uk:
    "Повернення протягом 14 днів за умови збереження товарного вигляду. Індивідуальні замовлення - за окремими умовами.",
  return_info_ru:
    "Возврат в течение 14 дней при сохранении товарного вида. Индивидуальные заказы - по отдельным условиям.",
  return_info_en:
    "Returns within 14 days if the product is unused and in original condition.",
};
