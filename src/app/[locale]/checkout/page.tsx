import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { CHECKOUT_SUMMARY_COPY, normalizeLocale, tr } from "@/lib/localization";
import { formatPrice, tJson } from "@/lib/utils";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "checkout" });
  const cart = await getCart();
  const products = await prisma.product.findMany({
    where: { id: { in: cart.map((item) => item.productId) } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const rows = cart
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return {
        id: product.id,
        name: tJson(product.name, locale),
        image: product.images[0]?.url || null,
        qty: item.qty,
        unitPrice: product.retailPrice,
        total: product.retailPrice * item.qty,
      };
    })
    .filter(Boolean) as { id: string; name: string; image: string | null; qty: number; unitPrice: number; total: number }[];
  const total = rows.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="container-f py-10">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0">
          <CheckoutForm locale={locale} />
        </div>
        <aside className="rounded-lg border border-black/10 bg-white p-5 shadow-card lg:sticky lg:top-28">
          <h2 className="font-semibold">{tr(CHECKOUT_SUMMARY_COPY.title, locale)}</h2>
          <div className="mt-4 grid gap-3">
            {rows.map((item) => (
              <div key={item.id} className="grid grid-cols-[58px_minmax(0,1fr)_auto] gap-3 rounded-lg bg-mist p-2">
                <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-white">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="58px" className="object-contain p-1.5" />
                  ) : (
                    <span className="text-[10px] font-semibold text-graphite/35">Locko</span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block line-clamp-2 text-sm font-medium leading-snug">{item.name}</span>
                  <span className="mt-1 block text-xs text-graphite/55">
                    {tr(CHECKOUT_SUMMARY_COPY.qty, locale)}: {item.qty} × {formatPrice(item.unitPrice, locale)}
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(item.total, locale)}</span>
              </div>
            ))}
            {rows.length === 0 && <p className="text-sm text-graphite/60">{tr(CHECKOUT_SUMMARY_COPY.empty, locale)}</p>}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
            <span className="text-sm text-graphite/60">{tr(CHECKOUT_SUMMARY_COPY.total, locale)}</span>
            <span className="text-xl font-semibold">{formatPrice(total, locale)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
