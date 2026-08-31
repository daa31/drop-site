import { siteSettings } from "@/lib/settings";
import { normalizeLocale, tr } from "@/lib/localization";

const COPY = {
  title: { uk: "Доставка і оплата", ru: "Доставка и оплата", en: "Delivery and Payment" },
  delivery: { uk: "Доставка", ru: "Доставка", en: "Delivery" },
  payment: { uk: "Оплата", ru: "Оплата", en: "Payment" },
  returns: { uk: "Повернення", ru: "Возврат", en: "Returns" },
};

export default async function Delivery({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const s = await siteSettings();
  const delivery = s[`delivery_info_${locale}`] || s.delivery_info_uk;
  const payment = s[`payment_info_${locale}`] || s.payment_info_uk;
  const ret = s[`return_info_${locale}`] || s.return_info_uk;
  return (
    <div className="container-f max-w-3xl py-10">
      <h1 className="font-display text-3xl">{tr(COPY.title, locale)}</h1>
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">{tr(COPY.delivery, locale)}</h2>
        <p className="mt-2 text-sm text-graphite/80">{delivery}</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">{tr(COPY.payment, locale)}</h2>
        <p className="mt-2 text-sm text-graphite/80">{payment}</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">{tr(COPY.returns, locale)}</h2>
        <p className="mt-2 text-sm text-graphite/80">{ret}</p>
      </section>
    </div>
  );
}
