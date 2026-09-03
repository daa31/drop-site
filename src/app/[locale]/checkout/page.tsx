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
      const unitPrice = product.retailPrice;
      const oldPrice = product.oldPrice || null;
      const total = unitPrice * item.qty;
      const originalTotal = (oldPrice || unitPrice) * item.qty;
      return {
        id: product.id,
        name: tJson(product.name, locale),
        image: product.images[0]?.url || null,
        qty: item.qty,
        unitPrice,
        oldPrice,
        total,
        originalTotal,
      };
    })
    .filter(Boolean) as {
    id: string;
    name: string;
    image: string | null;
    qty: number;
    unitPrice: number;
    oldPrice: number | null;
    total: number;
    originalTotal: number;
  }[];

  const subtotal = rows.reduce((sum, item) => sum + item.originalTotal, 0);
  const total = rows.reduce((sum, item) => sum + item.total, 0);
  const discount = subtotal - total;

  const alsoProducts = await prisma.product.findMany({
    where: { stockStatus: "in_stock", id: { notIn: rows.map((r) => r.id) } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const alsoItems = alsoProducts
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: tJson(p.name, locale),
      image: p.images[0]?.url || null,
      retailPrice: p.retailPrice,
      oldPrice: p.oldPrice || null,
    }))
    .slice(0, 4);

  return (
    <div className="container-f py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl">{t("title")}</h1>

        <CheckoutForm
          locale={locale}
          cartItems={rows}
          subtotal={subtotal}
          discount={discount}
          total={total}
        />

        {alsoItems.length > 0 && (
          <section className="mt-12 rounded-lg border border-black/10 bg-white p-5 shadow-card">
            <h2 className="mb-4 font-semibold">{tr(CHECKOUT_SUMMARY_COPY.alsoBought, locale)}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {alsoItems.map((item) => (
                <a key={item.id} href={`/${locale}/catalog/${item.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[#eef0ed]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="120px" className="object-contain p-2 transition group-hover:scale-105" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-xs text-graphite/30">Locko</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{item.name}</p>
                  <p className="mt-1 text-sm font-semibold">{formatPrice(item.retailPrice, locale)}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-lg border border-black/10 bg-white p-5 shadow-card">
          <h2 className="mb-3 font-semibold">{tr(CHECKOUT_SUMMARY_COPY.quickOrder, locale)}</h2>
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">+380 (___) ___-__-__</span>
          </div>
          <p className="mt-2 text-xs text-graphite/50">{tr(CHECKOUT_SUMMARY_COPY.quickOrder, locale)}</p>
        </section>
      </div>
    </div>
  );
}
