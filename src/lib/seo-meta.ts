import { normalizeLocale } from "@/lib/localization";
import type { Metadata } from "next";

export const STATIC_PAGE_DESC: Record<string, Record<string, string>> = {
  home: {
    uk: "Інтернет-магазин захисних окулярів Locko — захист зору для роботи, спорту та активного відпочинку. Поляризаційні, фотохромні, діоптричні моделі. Доставка Новою Поштою по Україні.",
    en: "Locko online store of safety eyewear — eye protection for work, sports and outdoor activities. Polarized, photochromic and diopter models. Delivery across Ukraine by Nova Poshta.",
  },
  catalog: {
    uk: "Каталог захисних окулярів Locko — обирайте за типом лінзи, кольором, поляризацією, призначенням та брендом. Актуальні ціни, контроль наявності, доставка Новою Поштою.",
    en: "Locko safety eyewear catalog — filter by lens type, color, polarization, use case and brand. Current prices, stock control, Nova Poshta delivery.",
  },
  optics: {
    uk: "Оптика Locko — поляризаційні, фотохромні та діоптричні захисні окуляри. Обирайте модель під задачу: для роботи, водіння, спорту чи відпочинку.",
    en: "Locko optics — polarized, photochromic and diopter safety eyewear. Pick a model for your task: work, driving, sports or leisure.",
  },
  guide: {
    uk: "Гід Locko — підбір захисних окулярів за вашою задачею. Вкажіть, де використовуватимете окуляри, тип лінзи та чи потрібен Anti-Fog — покажемо моделі, що підходять.",
    en: "Locko guide — match protective eyewear to your use case. Tell us where you will use the glasses, the lens type and whether you need Anti-Fog — we will show matching models.",
  },
  delivery: {
    uk: "Доставка і оплата в Locko — Нова Пошта по Україні, зручні способи оплати та умови повернення замовлення.",
    en: "Locko delivery and payment — Nova Poshta across Ukraine, convenient payment options and order return policy.",
  },
  contacts: {
    uk: "Контакти Locko — напишіть нам питання про товари, наявність, замовлення або доставку. Ми відповімо на ваше повідомлення.",
    en: "Locko contacts — send us a question about products, availability, orders or delivery. We will reply to your message.",
  },
  faq: {
    uk: "Питання та відповіді Locko — про вибір захисних окулярів, замовлення, доставку та оплату в магазині.",
    en: "Locko questions and answers — about choosing safety eyewear, ordering, delivery and payment.",
  },
  brands: {
    uk: "Бренди захисних окулярів у Locko — обирайте моделі від перевірених виробників, звіряйте артикули та ціни.",
    en: "Safety eyewear brands at Locko — choose models from trusted manufacturers, verify SKUs and prices.",
  },
};

export const STATIC_PAGE_TITLE: Record<string, Record<string, string>> = {
  home: {
    uk: "Locko — захисні окуляри для роботи, спорту та відпочинку",
    en: "Locko — safety eyewear for work, sports and leisure",
  },
  catalog: {
    uk: "Каталог захисних окулярів | Locko",
    en: "Safety eyewear catalog | Locko",
  },
  optics: {
    uk: "Оптика: поляризаційні, фотохромні, діоптричні окуляри | Locko",
    en: "Optics: polarized, photochromic, diopter eyewear | Locko",
  },
  guide: {
    uk: "Гід: як підібрати захисні окуляри | Locko",
    en: "Guide: how to choose safety eyewear | Locko",
  },
  delivery: {
    uk: "Доставка і оплата | Locko",
    en: "Delivery and payment | Locko",
  },
  contacts: {
    uk: "Контакти | Locko",
    en: "Contacts | Locko",
  },
  faq: {
    uk: "Питання та відповіді | Locko",
    en: "Questions and answers | Locko",
  },
  brands: {
    uk: "Бренди захисних окулярів | Locko",
    en: "Safety eyewear brands | Locko",
  },
};

export function buildMetadata(opts: {
  pageKey: string;
  title?: string;
  descriptionKey?: string;
  description?: string;
  path: string;
  locale?: string | null;
}): Metadata {
  const locale = normalizeLocale(opts.locale);
  const title = opts.title || STATIC_PAGE_TITLE[opts.pageKey]?.[locale] || "Locko";
  const description =
    opts.description ||
    (opts.descriptionKey ? STATIC_PAGE_DESC[opts.descriptionKey]?.[locale] || "" : "");
  return {
    title,
    description: description || undefined,
    alternates: { canonical: opts.path },
    openGraph: description ? { title, description } : { title },
  };
}

export function categoryDescription(name: string, locale: string): string {
  if (locale === "en") {
    return `Safety eyewear "${name}" — Locko catalog. Verified SKUs, current prices, Nova Poshta delivery across Ukraine.`;
  }
  return `Захисні окуляри «${name}» — каталог моделей Locko. Перевірені артикули, актуальні ціни, доставка Новою Поштою по Україні.`;
}

export function brandDescription(name: string, locale: string): string {
  if (locale === "en") {
    return `${name} safety eyewear — Locko catalog. Verified SKUs, current prices, Nova Poshta delivery across Ukraine.`;
  }
  return `Захисні окуляри ${name} — каталог моделей Locko. Перевірені артикули, актуальні ціни, доставка Новою Поштою по Україні.`;
}
