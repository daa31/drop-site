import { normalizeLocale, tr } from "@/lib/localization";

const COPY = {
  title: { uk: "Умови використання", ru: "Условия использования", en: "Terms of Use" },
  body: {
    uk: "Оформлюючи замовлення, ви підтверджуєте дані доставки та згоду на обробку персональних даних. Остаточна ціна фіксується після підтвердження замовлення менеджером. Locko - самостійний інтернет-магазин і не є вітриною постачальника.",
    ru: "Оформляя заказ, вы подтверждаете данные доставки и согласие на обработку персональных данных. Итоговая цена фиксируется после подтверждения заказа менеджером. Locko - самостоятельный интернет-магазин и не является витриной поставщика.",
    en: "By placing an order, you confirm the delivery details and consent to personal data processing. The final price is fixed after a manager confirms the order. Locko is an independent online store and is not a supplier storefront.",
  },
};

export default async function Terms({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  return (
    <div className="container-f max-w-3xl py-10 text-sm leading-7 text-graphite/80">
      <h1 className="font-display text-3xl text-ink">{tr(COPY.title, locale)}</h1>
      <p className="mt-6">{tr(COPY.body, locale)}</p>
    </div>
  );
}
