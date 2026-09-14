import { normalizeLocale } from "@/lib/localization";
import type { Metadata } from "next";

type Lang = "uk" | "ru" | "en";

export const STATIC_PAGE_DESC: Record<string, Record<Lang, string>> = {
  home: {
    uk: "Інтернет-магазин захисних окулярів Locko — захист зору для роботи, спорту та активного відпочинку. Поляризаційні, фотохромні, діоптричні моделі. Доставка Новою Поштою по Україні.",
    ru: "Интернет-магазин защитных очков Locko — защита зрения для работы, спорта и активного отдыха. Поляризационные, фотохромные, диоптрические модели. Доставка Новой Почтой по Украине.",
    en: "Locko online store of safety eyewear — eye protection for work, sports and outdoor activities. Polarized, photochromic and diopter models. Delivery across Ukraine by Nova Poshta.",
  },
  catalog: {
    uk: "Каталог захисних окулярів Locko — обирайте за типом лінзи, кольором, поляризацією, призначенням та брендом. Актуальні ціни, контроль наявності, доставка Новою Поштою.",
    ru: "Каталог защитных очков Locko — выбирайте по типу линзы, цвету, поляризации, назначению и бренду. Актуальные цены, контроль наличия, доставка Новой Почтой.",
    en: "Locko safety eyewear catalog — filter by lens type, color, polarization, use case and brand. Current prices, stock control, Nova Poshta delivery.",
  },
  optics: {
    uk: "Оптика Locko — поляризаційні, фотохромні та діоптричні захисні окуляри. Обирайте модель під задачу: для роботи, водіння, спорту чи відпочинку.",
    ru: "Оптика Locko — поляризационные, фотохромные и диоптрические защитные очки. Выбирайте модель под задачу: для работы, вождения, спорта или отдыха.",
    en: "Locko optics — polarized, photochromic and diopter safety eyewear. Pick a model for your task: work, driving, sports or leisure.",
  },
  guide: {
    uk: "Гід Locko — підбір захисних окулярів за вашою задачею. Вкажіть, де використовуватимете окуляри, тип лінзи та чи потрібен Anti-Fog — покажемо моделі, що підходять.",
    ru: "Гид Locko — подбор защитных очков под вашу задачу. Укажите, где будете использовать очки, тип линзы и нужен ли Anti-Fog — покажем подходящие модели.",
    en: "Locko guide — match protective eyewear to your use case. Tell us where you will use the glasses, the lens type and whether you need Anti-Fog — we will show matching models.",
  },
  delivery: {
    uk: "Доставка і оплата в Locko — Нова Пошта по Україні, зручні способи оплати та умови повернення замовлення.",
    ru: "Доставка и оплата в Locko — Новая Почта по Украине, удобные способы оплаты и условия возврата заказа.",
    en: "Locko delivery and payment — Nova Poshta across Ukraine, convenient payment options and order return policy.",
  },
  contacts: {
    uk: "Контакти Locko — напишіть нам питання про товари, наявність, замовлення або доставку. Ми відповімо на ваше повідомлення.",
    ru: "Контакты Locko — напишите нам вопрос о товарах, наличии, заказе или доставке. Мы ответим на ваше сообщение.",
    en: "Locko contacts — send us a question about products, availability, orders or delivery. We will reply to your message.",
  },
  faq: {
    uk: "Питання та відповіді Locko — про вибір захисних окулярів, замовлення, доставку та оплату в магазині.",
    ru: "Вопросы и ответы Locko — о выборе защитных очков, заказе, доставке и оплате в магазине.",
    en: "Locko questions and answers — about choosing safety eyewear, ordering, delivery and payment.",
  },
  brands: {
    uk: "Бренди захисних окулярів у Locko — обирайте моделі від перевірених виробників, звіряйте артикули та ціни.",
    ru: "Бренды защитных очков в Locko — выбирайте модели от проверенных производителей, сверяйте артикулы и цены.",
    en: "Safety eyewear brands at Locko — choose models from trusted manufacturers, verify SKUs and prices.",
  },
};

export const STATIC_PAGE_TITLE: Record<string, Record<Lang, string>> = {
  home: {
    uk: "Locko — захисні окуляри для роботи, спорту та відпочинку",
    ru: "Locko — защитные очки для работы, спорта и отдыха",
    en: "Locko — safety eyewear for work, sports and leisure",
  },
  catalog: {
    uk: "Каталог захисних окулярів | Locko",
    ru: "Каталог защитных очков | Locko",
    en: "Safety eyewear catalog | Locko",
  },
  optics: {
    uk: "Оптика: поляризаційні, фотохромні, діоптричні окуляри | Locko",
    ru: "Оптика: поляризационные, фотохромные, диоптрические очки | Locko",
    en: "Optics: polarized, photochromic, diopter eyewear | Locko",
  },
  guide: {
    uk: "Гід: як підібрати захисні окуляри | Locko",
    ru: "Гид: как подобрать защитные очки | Locko",
    en: "Guide: how to choose safety eyewear | Locko",
  },
  delivery: {
    uk: "Доставка і оплата | Locko",
    ru: "Доставка и оплата | Locko",
    en: "Delivery and payment | Locko",
  },
  contacts: {
    uk: "Контакти | Locko",
    ru: "Контакты | Locko",
    en: "Contacts | Locko",
  },
  faq: {
    uk: "Питання та відповіді | Locko",
    ru: "Вопросы и ответы | Locko",
    en: "Questions and answers | Locko",
  },
  brands: {
    uk: "Бренди захисних окулярів | Locko",
    ru: "Бренды защитных очков | Locko",
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

export function categoryDescription(name: string, locale: Lang): string {
  if (locale === "ru") {
    return `Защитные очки «${name}» — каталог моделей Locko. Проверенные артикулы, актуальные цены, доставка Новой Почтой по Украине.`;
  }
  if (locale === "en") {
    return `Safety eyewear "${name}" — Locko catalog. Verified SKUs, current prices, Nova Poshta delivery across Ukraine.`;
  }
  return `Захисні окуляри «${name}» — каталог моделей Locko. Перевірені артикули, актуальні ціни, доставка Новою Поштою по Україні.`;
}

export function brandDescription(name: string, locale: Lang): string {
  if (locale === "ru") {
    return `Защитные очки ${name} — каталог моделей Locko. Проверенные артикулы, актуальные цены, доставка Новой Почтой по Украине.`;
  }
  if (locale === "en") {
    return `${name} safety eyewear — Locko catalog. Verified SKUs, current prices, Nova Poshta delivery across Ukraine.`;
  }
  return `Захисні окуляри ${name} — каталог моделей Locko. Перевірені артикули, актуальні ціни, доставка Новою Поштою по Україні.`;
}