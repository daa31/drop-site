import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { toCard } from "@/lib/catalog";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductBuy } from "@/components/ProductBuy";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1 }, seo: true },
  });
  if (!product) return {};
  const title = tJson(product.seo?.title || product.name, locale);
  const description = tJson(product.seo?.description || product.shortDescription || product.description, locale);
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, images: product.images[0] ? [product.images[0].url] : [] },
  };
}

function copy(locale: string) {
  if (locale === "ru") {
    return {
      verified: "Проверенный артикул",
      stock: "Контроль наличия",
      delivery: "Новая почта",
      confirmation: "Подтверждение заказа",
      noKit: "Комплектация соответствует поставке производителя.",
      noUsage: "Подходит для работы, спорта или активного отдыха согласно характеристикам модели.",
      attr: {
        lensColor: "Цвет линзы",
        frameColor: "Цвет оправы",
        antiFog: "Антизапотевание",
        polarized: "Поляризация",
        photochromic: "Фотохром",
        interchangeable: "Сменные линзы",
        rxInsert: "Диоптрическая вставка",
        uv: "UV-защита",
      },
      value: { yes: "Да", no: "Нет" },
      summary(name: string, brand?: string | null, category?: string, attrs?: Record<string, string>) {
        const lens = attrs?.lensColor ? ` Линза: ${prettyValue(attrs.lensColor, locale)}.` : "";
        const frame = attrs?.frameColor ? ` Оправа: ${prettyValue(attrs.frameColor, locale)}.` : "";
        return `${name} - модель ${brand || "поставщика"}${category ? ` из категории "${category}"` : ""}. Подходит для ежедневного использования по назначению, защиты глаз и комфортной посадки.${lens}${frame} Артикул помогает быстро сверить товар при подтверждении заказа.`;
      },
    };
  }
  if (locale === "en") {
    return {
      verified: "Verified SKU",
      stock: "Stock tracking",
      delivery: "Nova Poshta",
      confirmation: "Order confirmation",
      noKit: "The kit matches the manufacturer's package.",
      noUsage: "Suitable for work, sport or outdoor use according to the model specs.",
      attr: {
        lensColor: "Lens color",
        frameColor: "Frame color",
        antiFog: "Anti-Fog",
        polarized: "Polarized",
        photochromic: "Photochromic",
        interchangeable: "Interchangeable lenses",
        rxInsert: "Rx insert",
        uv: "UV protection",
      },
      value: { yes: "Yes", no: "No" },
      summary(name: string, brand?: string | null, category?: string, attrs?: Record<string, string>) {
        const lens = attrs?.lensColor ? ` Lens: ${prettyValue(attrs.lensColor, locale)}.` : "";
        const frame = attrs?.frameColor ? ` Frame: ${prettyValue(attrs.frameColor, locale)}.` : "";
        return `${name} is a ${brand || "supplier"} model${category ? ` from "${category}"` : ""}. It is selected for eye protection, comfortable fit and task-focused everyday use.${lens}${frame} The SKU helps verify the exact item during order confirmation.`;
      },
    };
  }
  return {
    verified: "Перевірений артикул",
    stock: "Контроль наявності",
    delivery: "Нова пошта",
    confirmation: "Підтвердження замовлення",
    noKit: "Комплектація відповідає поставці виробника.",
    noUsage: "Підходить для роботи, спорту або активного відпочинку згідно з характеристиками моделі.",
    attr: {
      lensColor: "Колір лінзи",
      frameColor: "Колір оправи",
      antiFog: "Антизапотівання",
      polarized: "Поляризація",
      photochromic: "Фотохром",
      interchangeable: "Змінні лінзи",
      rxInsert: "Діоптрична вставка",
      uv: "UV-захист",
    },
    value: { yes: "Так", no: "Ні" },
    summary(name: string, brand?: string | null, category?: string, attrs?: Record<string, string>) {
      const lens = attrs?.lensColor ? ` Лінза: ${prettyValue(attrs.lensColor, locale)}.` : "";
      const frame = attrs?.frameColor ? ` Оправа: ${prettyValue(attrs.frameColor, locale)}.` : "";
      return `${name} - модель ${brand || "постачальника"}${category ? ` з категорії "${category}"` : ""}. Підійде для захисту очей, комфортної посадки та щоденного використання за призначенням.${lens}${frame} Артикул допомагає швидко звірити товар під час підтвердження замовлення.`;
    },
  };
}

function prettyValue(value: string, locale: string) {
  const normalized = value.trim().toLowerCase();
  const yesNo = {
    uk: { yes: "Так", no: "Ні" },
    ru: { yes: "Да", no: "Нет" },
    en: { yes: "Yes", no: "No" },
  }[locale] || { yes: "Так", no: "Ні" };
  if (["yes", "true", "1", "да", "так"].includes(normalized)) return yesNo.yes;
  if (["no", "false", "0", "нет", "ні"].includes(normalized)) return yesNo.no;
  const normalizedValues: Record<string, Record<string, string>> = {
    "серый": { uk: "Сірий", ru: "Серый", en: "Gray" },
    "сірий": { uk: "Сірий", ru: "Серый", en: "Gray" },
    "gray": { uk: "Сірий", ru: "Серый", en: "Gray" },
    "grey": { uk: "Сірий", ru: "Серый", en: "Gray" },
    "коричневый": { uk: "Коричневий", ru: "Коричневый", en: "Brown" },
    "коричневий": { uk: "Коричневий", ru: "Коричневый", en: "Brown" },
    "бронзовый": { uk: "Бронзовий", ru: "Бронзовый", en: "Bronze" },
    "бронзовий": { uk: "Бронзовий", ru: "Бронзовый", en: "Bronze" },
    "прозрачный": { uk: "Прозорий", ru: "Прозрачный", en: "Clear" },
    "прозорий": { uk: "Прозорий", ru: "Прозрачный", en: "Clear" },
    "clear": { uk: "Прозорий", ru: "Прозрачный", en: "Clear" },
    "желтый": { uk: "Жовтий", ru: "Желтый", en: "Yellow" },
    "жовтий": { uk: "Жовтий", ru: "Желтый", en: "Yellow" },
    "полуоправа": { uk: "Напівоправа", ru: "Полуоправа", en: "Half frame" },
    "напівоправа": { uk: "Напівоправа", ru: "Полуоправа", en: "Half frame" },
    "в оправе": { uk: "В оправі", ru: "В оправе", en: "Full frame" },
    "в оправі": { uk: "В оправі", ru: "В оправе", en: "Full frame" },
    "черный": { uk: "Чорний", ru: "Черный", en: "Black" },
    "чорний": { uk: "Чорний", ru: "Черный", en: "Black" },
    "black": { uk: "Чорний", ru: "Черный", en: "Black" },
    "белый": { uk: "Білий", ru: "Белый", en: "White" },
    "білий": { uk: "Білий", ru: "Белый", en: "White" },
    "white": { uk: "Білий", ru: "Белый", en: "White" },
    "синий": { uk: "Синій", ru: "Синий", en: "Blue" },
    "синій": { uk: "Синій", ru: "Синий", en: "Blue" },
    "blue": { uk: "Синій", ru: "Синий", en: "Blue" },
    "зеленый": { uk: "Зелений", ru: "Зеленый", en: "Green" },
    "зелений": { uk: "Зелений", ru: "Зеленый", en: "Green" },
    "green": { uk: "Зелений", ru: "Зеленый", en: "Green" },
    "красный": { uk: "Червоний", ru: "Красный", en: "Red" },
    "червоний": { uk: "Червоний", ru: "Красный", en: "Red" },
    "red": { uk: "Червоний", ru: "Красный", en: "Red" },
    "оранжевый": { uk: "Помаранчевий", ru: "Оранжевый", en: "Orange" },
    "помаранчевий": { uk: "Помаранчевий", ru: "Оранжевый", en: "Orange" },
    "orange": { uk: "Помаранчевий", ru: "Оранжевый", en: "Orange" },
    "зеркальный": { uk: "Дзеркальний", ru: "Зеркальный", en: "Mirror" },
    "дзеркальний": { uk: "Дзеркальний", ru: "Зеркальный", en: "Mirror" },
    "mirror": { uk: "Дзеркальний", ru: "Зеркальный", en: "Mirror" },
    "серебристый": { uk: "Сріблястий", ru: "Серебристый", en: "Silver" },
    "сріблястий": { uk: "Сріблястий", ru: "Серебристый", en: "Silver" },
    "silver": { uk: "Сріблястий", ru: "Серебристый", en: "Silver" },
    "дымчатый": { uk: "Димчастий", ru: "Дымчатый", en: "Smoke" },
    "димчастий": { uk: "Димчастий", ru: "Дымчатый", en: "Smoke" },
    "smoke": { uk: "Димчастий", ru: "Дымчатый", en: "Smoke" },
    "темный": { uk: "Темний", ru: "Темный", en: "Dark" },
    "темний": { uk: "Темний", ru: "Темный", en: "Dark" },
    "dark": { uk: "Темний", ru: "Темный", en: "Dark" },
    "без оправы": { uk: "Без оправи", ru: "Без оправы", en: "Rimless" },
    "без оправи": { uk: "Без оправи", ru: "Без оправы", en: "Rimless" },
  };
  if (normalizedValues[normalized]) return normalizedValues[normalized][locale] || normalizedValues[normalized].uk;
  const replacements = Object.entries(normalizedValues).sort((a, b) => b[0].length - a[0].length);
  let translated = value;
  for (const [source, texts] of replacements) {
    translated = translated.replace(new RegExp(source, "gi"), texts[locale] || texts.uk);
  }
  return translated;
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const n = await getTranslations({ locale, namespace: "nav" });
  const c = copy(locale);
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
    },
  });
  if (!product || !product.isActive) notFound();

  const categoryIds = product.categories.map((item) => item.categoryId);
  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      images: { some: {} },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: { brand: true, images: { take: 1 } },
    take: 4,
  });
  const together = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { notIn: [product.id, ...related.map((item) => item.id)] },
      images: { some: {} },
    },
    include: { brand: true, images: { take: 1 } },
    orderBy: { popularity: "desc" },
    take: 3,
  });

  const name = tJson(product.name, locale);
  const attrs = (product.attributes || {}) as Record<string, string>;
  const inStock = product.stockStatus === "in_stock" && product.stock > 0;
  const cat = product.categories[0]?.category;
  const categoryName = cat ? tJson(cat.name, locale) : "";
  const overview = tJson(product.shortDescription, locale) || tJson(product.description, locale) || c.summary(name, product.brand?.name, categoryName, attrs);
  const kit = tJson(product.kit, locale) || c.noKit;
  const usage = tJson(product.usage, locale) || c.noUsage;

  return (
    <div className="pb-24 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            sku: product.sku,
            brand: product.brand?.name,
            image: product.images.map((i) => i.url),
            description: overview,
            offers: {
              "@type": "Offer",
              price: product.retailPrice,
              priceCurrency: "UAH",
              availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
            },
          }),
        }}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: "Locko" },
          { href: "/catalog", label: n("catalog") },
          ...(cat ? [{ href: `/catalog/${cat.slug}`, label: categoryName }] : []),
          ...(product.brand ? [{ href: `/brands/${product.brand.slug}`, label: product.brand.name }] : []),
          { label: name },
        ]}
      />

      <div className="grid w-full min-w-0 gap-6 pl-0 pr-4 sm:pr-6 lg:grid-cols-[minmax(0,62vw)_minmax(360px,1fr)] lg:items-start">
        <ProductGallery images={product.images} alt={name} />
        <div className="min-w-0 lg:pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand?.name && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-graphite/60">{product.brand.name}</span>}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${inStock ? "bg-emerald-50 text-emerald-700" : "bg-white text-graphite/50"}`}>
              {inStock ? t("inStock") : t("out")}
            </span>
          </div>
          <h1 className="mt-4 break-words font-display text-3xl leading-tight sm:text-4xl xl:text-5xl">{name}</h1>
          <div className="mt-3 text-sm text-graphite/60">
            {t("sku")}: {product.sku}
          </div>
          <ProductBuy id={product.id} slug={product.slug} unitPrice={product.retailPrice} locale={locale} />
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-black/10 bg-black/10 sm:grid-cols-2">
            {[
              [ShieldCheck, c.verified],
              [PackageCheck, c.stock],
              [Truck, c.delivery],
              [BadgeCheck, c.confirmation],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3 bg-white p-4 text-sm font-medium">
                <Icon size={18} className="text-accent" />
                {label as string}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-f mt-14 grid items-start gap-10 lg:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
          <h2 className="font-display text-xl">{t("short")}</h2>
          <p className="mt-3 leading-7 text-graphite/80">{overview}</p>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-card">
          <h2 className="font-display text-xl">{t("specs")}</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-b border-black/5">
                <td className="py-2 text-graphite/50">{t("brand")}</td>
                <td>{product.brand?.name}</td>
              </tr>
              <tr className="border-b border-black/5">
                <td className="py-2 text-graphite/50">{t("sku")}</td>
                <td>{product.sku}</td>
              </tr>
              {Object.entries(attrs).map(([k, v]) => (
                <tr key={k} className="border-b border-black/5">
                  <td className="py-2 text-graphite/50">{c.attr[k as keyof typeof c.attr] || k}</td>
                  <td>{prettyValue(v, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-8 font-medium">{t("kit")}</h3>
          <p className="mt-2 text-sm text-graphite/80">{kit}</p>
          <h3 className="mt-6 font-medium">{t("usage")}</h3>
          <p className="mt-2 text-sm text-graphite/80">{usage}</p>
        </section>
      </div>

      <section className="container-f mt-14">
        <h2 className="font-display text-xl">{t("related")}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} p={toCard(p)} locale={locale} />
          ))}
        </div>
      </section>
      {together.length > 0 && (
        <section className="container-f mt-10">
          <h2 className="font-display text-xl">{t("together")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {together.map((p) => (
              <ProductCard key={p.id} p={toCard(p)} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
