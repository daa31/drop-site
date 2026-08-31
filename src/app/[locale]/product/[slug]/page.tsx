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

function hasEnglishText(field: unknown) {
  if (typeof field !== "object" || !field) return false;
  const en = ((field as Record<string, string>).en || "").trim();
  return Boolean(en) && !/[\u0400-\u04FF]/.test(en);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1 }, seo: true, brand: true, categories: { include: { category: true } } },
  });
  if (!product) return {};
  const title = tJson(product.seo?.title || product.name, locale);
  let description = tJson(product.seo?.description || product.shortDescription || product.description, locale);
  if (locale === "en" && !hasEnglishText(product.seo?.description) && !hasEnglishText(product.shortDescription) && !hasEnglishText(product.description)) {
    description = fallbackDescription({
      locale: "en",
      name: title,
      brand: product.brand?.name,
      category: product.categories[0]?.category ? tJson(product.categories[0].category.name, "en") : "",
      sku: product.sku,
      attrs: (product.attributes || {}) as Record<string, string>,
      weightGrams: product.weightGrams,
      dimensions: product.dimensions,
    });
  }
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

function hasDetailedDescription(value: string) {
  const text = value.trim();
  return text.length >= 360 || text.includes("\n- ") || text.includes("\n* ");
}

function firstParagraph(value: string) {
  return value.split(/\n{1,}/).map((part) => part.trim()).find(Boolean) || value.trim();
}

function fallbackDescription(opts: {
  locale: string;
  name: string;
  brand?: string | null;
  category?: string;
  sku: string;
  attrs: Record<string, string>;
  weightGrams?: number | null;
  dimensions?: string | null;
}) {
  const { locale, name, brand, category, sku, attrs, weightGrams, dimensions } = opts;
  const isEyewear = /окуляр|очк|glasses|goggle/i.test(name);
  const details = [
    sku ? `- ${locale === "ru" ? "артикул" : locale === "en" ? "SKU" : "артикул"}: ${sku};` : "",
    brand ? `- ${locale === "ru" ? "бренд" : locale === "en" ? "brand" : "бренд"}: ${brand};` : "",
    category ? `- ${locale === "ru" ? "категория" : locale === "en" ? "category" : "категорія"}: ${category};` : "",
    attrs.lensColor ? `- ${locale === "ru" ? "цвет линзы" : locale === "en" ? "lens color" : "колір лінзи"}: ${prettyValue(attrs.lensColor, locale)};` : "",
    attrs.frameColor ? `- ${locale === "ru" ? "тип/цвет оправы" : locale === "en" ? "frame" : "тип/колір оправи"}: ${prettyValue(attrs.frameColor, locale)};` : "",
    attrs.uv ? `- UV: ${prettyValue(attrs.uv, locale)};` : "",
    attrs.antiFog ? `- Anti-Fog: ${prettyValue(attrs.antiFog, locale)};` : "",
    attrs.polarized ? `- ${locale === "ru" ? "поляризация" : locale === "en" ? "polarized" : "поляризація"}: ${prettyValue(attrs.polarized, locale)};` : "",
    attrs.photochromic ? `- ${locale === "ru" ? "фотохром" : locale === "en" ? "photochromic" : "фотохром"}: ${prettyValue(attrs.photochromic, locale)};` : "",
    attrs.interchangeable ? `- ${locale === "ru" ? "сменные линзы" : locale === "en" ? "interchangeable lenses" : "змінні лінзи"}: ${prettyValue(attrs.interchangeable, locale)};` : "",
    attrs.rxInsert ? `- ${locale === "ru" ? "диоптрическая вставка" : locale === "en" ? "RX insert" : "діоптрична вставка"}: ${prettyValue(attrs.rxInsert, locale)};` : "",
    dimensions ? `- ${locale === "ru" ? "размеры" : locale === "en" ? "dimensions" : "розміри"}: ${dimensions};` : "",
    weightGrams ? `- ${locale === "ru" ? "вес" : locale === "en" ? "weight" : "вага"}: ${weightGrams} г;` : "",
  ].filter(Boolean);

  if (locale === "ru") {
    return [
      `${name} - ${brand ? `товар бренда ${brand}` : "позиция из каталога Locko"}${category ? ` в разделе "${category}"` : ""}. ${isEyewear ? "Модель подобрана для защиты зрения, комфортной посадки и ежедневного использования по назначению." : "Аксессуар помогает удобно хранить, переносить или обслуживать очки и дополняет базовый набор пользователя."}`,
      details.length ? `Основные данные:\n${details.join("\n")}` : "",
      "Перед отправкой менеджер Locko сверяет артикул, наличие и комплектацию, чтобы клиент получил именно выбранную позицию.",
    ].filter(Boolean).join("\n\n");
  }

  if (locale === "en") {
    return [
      `${name} is ${brand ? `a ${brand} item` : "a Locko catalog item"}${category ? ` from "${category}"` : ""}. ${isEyewear ? "It is selected for eye protection, comfortable fit and everyday task-focused use." : "The accessory helps store, carry or maintain eyewear and completes a practical eyewear kit."}`,
      details.length ? `Key details:\n${details.join("\n")}` : "",
      "Before shipment, Locko checks the SKU, availability and package contents so the customer receives the selected item.",
    ].filter(Boolean).join("\n\n");
  }

  return [
    `${name} - ${brand ? `товар бренду ${brand}` : "позиція з каталогу Locko"}${category ? ` у розділі "${category}"` : ""}. ${isEyewear ? "Модель підібрана для захисту зору, комфортної посадки та щоденного використання за призначенням." : "Аксесуар допомагає зручно зберігати, переносити або обслуговувати окуляри й доповнює базовий набір користувача."}`,
    details.length ? `Основні дані:\n${details.join("\n")}` : "",
    "Перед відправленням менеджер Locko звіряє артикул, наявність і комплектацію, щоб клієнт отримав саме обрану позицію.",
  ].filter(Boolean).join("\n\n");
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
  const generatedDescription = fallbackDescription({
    locale,
    name,
    brand: product.brand?.name,
    category: categoryName,
    sku: product.sku,
    attrs,
    weightGrams: product.weightGrams,
    dimensions: product.dimensions,
  });
  const isEn = locale === "en";
  const hasEnDescription = hasEnglishText(product.description);
  const hasEnShort = hasEnglishText(product.shortDescription);
  const hasEnKit = hasEnglishText(product.kit);
  const hasEnUsage = hasEnglishText(product.usage);

  let description: string;
  if (isEn && !hasEnDescription) {
    description = generatedDescription;
  } else {
    const full = tJson(product.description, locale);
    description = hasDetailedDescription(full) ? full : [full, generatedDescription].filter(Boolean).join("\n\n");
  }
  const overview = isEn && !hasEnShort
    ? firstParagraph(description) || c.summary(name, product.brand?.name, categoryName, attrs)
    : tJson(product.shortDescription, locale) || firstParagraph(description) || c.summary(name, product.brand?.name, categoryName, attrs);
  const kit = isEn && !hasEnKit ? c.noKit : tJson(product.kit, locale) || c.noKit;
  const usage = isEn && !hasEnUsage ? c.noUsage : tJson(product.usage, locale) || c.noUsage;
  const descriptionTitle = locale === "ru" ? "\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435" : locale === "en" ? "Description" : "\u041e\u043f\u0438\u0441";

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

      <div className="grid w-full min-w-0 gap-6 pl-0 pr-4 sm:pr-6 lg:grid-cols-[minmax(0,52vw)_minmax(360px,1fr)] lg:items-start">
        <ProductGallery images={product.images} alt={name} />
        <div className="min-w-0 px-4 sm:px-6 lg:px-0 lg:pt-4">
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
          <ProductBuy id={product.id} slug={product.slug} unitPrice={product.retailPrice} locale={locale} canOrder={inStock} />
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
          <h2 className="font-display text-xl">{descriptionTitle}</h2>
          <div className="mt-3 whitespace-pre-line leading-7 text-graphite/80">{description}</div>
        </section>
        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-card">
          <h2 className="font-display text-xl">{t("specs")}</h2>
          <table className="mt-3 w-full table-fixed text-sm">
            <tbody>
              <tr className="border-b border-black/5">
                <td className="w-[42%] py-2 align-top break-words text-graphite/50">{t("brand")}</td>
                <td className="py-2 break-words">{product.brand?.name}</td>
              </tr>
              <tr className="border-b border-black/5">
                <td className="w-[42%] py-2 align-top break-words text-graphite/50">{t("sku")}</td>
                <td className="py-2 break-words">{product.sku}</td>
              </tr>
              {Object.entries(attrs).map(([k, v]) => (
                <tr key={k} className="border-b border-black/5">
                  <td className="w-[42%] py-2 align-top break-words text-graphite/50">{c.attr[k as keyof typeof c.attr] || k}</td>
                  <td className="py-2 break-words">{prettyValue(v, locale)}</td>
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
