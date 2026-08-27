import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return (
    <div className="container-f max-w-2xl py-10">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <CheckoutForm locale={locale} />
    </div>
  );
}
