import { normalizeLocale, tr } from "@/lib/localization";

const COPY = {
  title: { uk: "Політика конфіденційності", ru: "Политика конфиденциальности", en: "Privacy Policy" },
  body: {
    uk: "Locko обробляє ім'я, телефон, email і адресу доставки лише для виконання замовлення, зв'язку з клієнтом і дотримання вимог законодавства України. Ми не продаємо дані третім особам. Платіжні ключі та внутрішні закупівельні ціни недоступні клієнтам.",
    ru: "Locko обрабатывает имя, телефон, email и адрес доставки только для выполнения заказа, связи с клиентом и соблюдения требований законодательства Украины. Мы не продаем данные третьим лицам. Платежные ключи и внутренние закупочные цены недоступны клиентам.",
    en: "Locko processes name, phone, email and delivery address only to fulfil orders, contact customers and meet Ukrainian legal requirements. We do not sell personal data to third parties. Payment keys and internal supplier prices are not available to customers.",
  },
};

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  return (
    <div className="container-f max-w-3xl py-10 text-sm leading-7 text-graphite/80">
      <h1 className="font-display text-3xl text-ink">{tr(COPY.title, locale)}</h1>
      <p className="mt-6">{tr(COPY.body, locale)}</p>
    </div>
  );
}
