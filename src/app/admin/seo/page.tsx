import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { type Locale } from "@/lib/localization";
import { tJson } from "@/lib/utils";

const COPY = {
  title: { uk: "SEO", en: "SEO" },
  intro: {
    uk: "Це не каталог для покупця, а службові SEO-записи для сторінок товарів і розділів.",
    en: "This is not the customer catalog, but service SEO records for product and section pages.",
  },
  whyTitle: { uk: "Для чого це потрібно", en: "Why this exists" },
  whyText: {
    uk: "Кожен шлях `/product/...` зберігає мета-заголовок, опис, H1 і зображення для Google та прев'ю у месенджерах. Якщо запис видалити, сторінка товару лишиться, але пошуковий опис стане гіршим.",
    en: "Each `/product/...` path stores meta title, description, H1 and image for Google and messenger previews. Removing it keeps the product page, but makes search snippets weaker.",
  },
  path: { uk: "Шлях", en: "Path" },
  pageTitle: { uk: "Заголовок", en: "Title" },
  description: { uk: "Опис", en: "Description" },
} satisfies Record<string, Record<Locale, string>>;

function t(key: keyof typeof COPY, locale: Locale) {
  return COPY[key][locale];
}

export default async function Seo() {
  const locale = await getAdminLocale();
  const pages = await prisma.seoPage.findMany({ take: 100, orderBy: { path: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl">{t("title", locale)}</h1>
        <p className="mt-1 text-sm text-graphite/60">{t("intro", locale)}</p>
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">{t("whyTitle", locale)}</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/70">{t("whyText", locale)}</p>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="w-[320px] px-5 py-3">{t("path", locale)}</th>
                <th className="w-[280px] px-4 py-3">{t("pageTitle", locale)}</th>
                <th className="px-4 py-3">{t("description", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-black/5 align-top">
                  <td className="px-5 py-3 font-mono text-xs text-graphite/65">{page.path}</td>
                  <td className="px-4 py-3 font-medium">{tJson(page.title, locale)}</td>
                  <td className="px-4 py-3 text-graphite/65">{tJson(page.description, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
