import { siteSettings } from "@/lib/settings";

export default async function Delivery({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const s = await siteSettings();
  const delivery = s[`delivery_info_${locale}`] || s.delivery_info_uk;
  const payment = s[`payment_info_${locale}`] || s.payment_info_uk;
  const ret = s[`return_info_${locale}`] || s.return_info_uk;
  return (
    <div className="container-f max-w-3xl py-10">
      <h1 className="font-display text-3xl">Доставка і оплата</h1>
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">Доставка</h2>
        <p className="mt-2 text-sm text-graphite/80">{delivery}</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">Оплата</h2>
        <p className="mt-2 text-sm text-graphite/80">{payment}</p>
      </section>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-medium">Повернення</h2>
        <p className="mt-2 text-sm text-graphite/80">{ret}</p>
      </section>
    </div>
  );
}
