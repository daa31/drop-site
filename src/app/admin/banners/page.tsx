import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Eye, Image as ImageIcon, LayoutPanelTop, Plus, Save, Trash2 } from "lucide-react";
import { ADMIN_COMMON_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { type Locale } from "@/lib/localization";
import { tJson } from "@/lib/utils";

const SLOT_OPTIONS = ["home_hero", "home_hero_1", "home_hero_2", "home_hero_3", "catalog_top", "product_side"];

const COPY = {
  title: { uk: "Банери", ru: "Баннеры", en: "Banners" },
  subtitle: {
    uk: "Керуйте промо-блоками сайту, зображеннями головного екрана, посиланнями та порядком показу.",
    ru: "Управляйте промо-блоками сайта, изображениями главного экрана, ссылками и порядком показа.",
    en: "Manage site promo blocks, home hero images, links and display order.",
  },
  newBanner: { uk: "Новий банер", ru: "Новый баннер", en: "New banner" },
  editBanner: { uk: "Редагувати", ru: "Редактировать", en: "Edit" },
  preview: { uk: "Прев'ю", ru: "Превью", en: "Preview" },
  slot: { uk: "Слот", ru: "Слот", en: "Slot" },
  order: { uk: "Порядок", ru: "Порядок", en: "Order" },
  active: { uk: "Активний", ru: "Активный", en: "Active" },
  titleUk: { uk: "Заголовок UA", ru: "Заголовок UA", en: "Title UA" },
  titleRu: { uk: "Заголовок RU", ru: "Заголовок RU", en: "Title RU" },
  titleEn: { uk: "Заголовок EN", ru: "Заголовок EN", en: "Title EN" },
  subtitleUk: { uk: "Підзаголовок UA", ru: "Подзаголовок UA", en: "Subtitle UA" },
  subtitleRu: { uk: "Підзаголовок RU", ru: "Подзаголовок RU", en: "Subtitle RU" },
  subtitleEn: { uk: "Підзаголовок EN", ru: "Подзаголовок EN", en: "Subtitle EN" },
  href: { uk: "Посилання", ru: "Ссылка", en: "Link" },
  image: { uk: "URL зображення", ru: "URL изображения", en: "Image URL" },
  saved: { uk: "Банер збережено.", ru: "Баннер сохранен.", en: "Banner saved." },
  deleted: { uk: "Банер видалено.", ru: "Баннер удален.", en: "Banner deleted." },
  invalid: {
    uk: "Заповніть слот, заголовок, посилання та URL зображення.",
    ru: "Заполните слот, заголовок, ссылку и URL изображения.",
    en: "Fill slot, title, link and image URL.",
  },
  empty: { uk: "Банерів поки немає.", ru: "Баннеров пока нет.", en: "No banners yet." },
  heroHint: {
    uk: "Для головної сторінки використовуйте `home_hero` для тексту і `home_hero_1`, `home_hero_2`, `home_hero_3` для трьох фото.",
    ru: "Для главной страницы используйте `home_hero` для текста и `home_hero_1`, `home_hero_2`, `home_hero_3` для трех фото.",
    en: "Use `home_hero` for home text and `home_hero_1`, `home_hero_2`, `home_hero_3` for the three photos.",
  },
} satisfies Record<string, Record<Locale, string>>;

function t(key: keyof typeof COPY, locale: Locale) {
  return COPY[key][locale];
}

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function textValue(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}

type BannerText = {
  uk: string;
  ru: string;
  en: string;
};

function bannerRedirect(params: Record<string, string>): never {
  const sp = new URLSearchParams(params);
  redirect(`/admin/banners?${sp.toString()}`);
}

function localizedFromForm(fd: FormData, prefix: "title" | "subtitle"): BannerText | null {
  const uk = textValue(fd, `${prefix}_uk`);
  const ru = textValue(fd, `${prefix}_ru`);
  const en = textValue(fd, `${prefix}_en`);
  const fallback = uk || ru || en;
  if (!fallback) return null;
  return {
    uk: uk || fallback,
    ru: ru || fallback,
    en: en || fallback,
  };
}

async function saveBanner(fd: FormData) {
  "use server";

  const id = textValue(fd, "id");
  const slot = textValue(fd, "slot");
  const href = textValue(fd, "href") || "/catalog";
  const image = textValue(fd, "image");
  const title = localizedFromForm(fd, "title");
  const subtitle = localizedFromForm(fd, "subtitle");
  const sortOrder = Number.parseInt(textValue(fd, "sortOrder") || "0", 10);
  const active = fd.get("active") === "on";

  if (!slot || !image || !title) bannerRedirect({ error: "invalid" });

  const titleJson = title as Prisma.InputJsonValue;
  const subtitleJson = subtitle ? (subtitle as Prisma.InputJsonValue) : Prisma.JsonNull;
  const data = {
    slot,
    title: titleJson,
    subtitle: subtitleJson,
    href,
    image,
    active,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };

  if (id) await prisma.banner.update({ where: { id }, data });
  else await prisma.banner.create({ data });

  revalidatePath("/admin/banners");
  revalidatePath("/");
  bannerRedirect({ saved: "1" });
}

async function deleteBanner(fd: FormData) {
  "use server";
  const id = textValue(fd, "id");
  if (id) await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  bannerRedirect({ deleted: "1" });
}

function textField(label: string, name: string, defaultValue = "", required = false) {
  return (
    <label className="text-sm">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 outline-none focus:border-ink"
      />
    </label>
  );
}

function localizedValue(value: unknown, locale: Locale) {
  const source = (value || {}) as Record<Locale, string>;
  return source[locale] || "";
}

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, sp, banners] = await Promise.all([
    getAdminLocale(),
    searchParams,
    prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { slot: "asc" }] }),
  ]);
  const hasMessage = sp.saved || sp.deleted || sp.error;

  return (
    <div className="grid max-w-6xl gap-6">
      <div>
        <h1 className="font-display text-3xl">{t("title", locale)}</h1>
        <p className="mt-1 text-sm text-graphite/60">{t("subtitle", locale)}</p>
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-graphite/60 shadow-sm">{t("heroHint", locale)}</p>
        {hasMessage && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${sp.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
            {sp.error ? t("invalid", locale) : sp.deleted ? t("deleted", locale) : t("saved", locale)}
          </div>
        )}
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 font-semibold">
          <Plus size={18} />
          {t("newBanner", locale)}
        </div>
        <form action={saveBanner} className="mt-5 grid gap-4">
          <datalist id="banner-slots">
            {SLOT_OPTIONS.map((slot) => (
              <option key={slot} value={slot} />
            ))}
          </datalist>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_140px]">
            <label className="text-sm">
              {t("slot", locale)}
              <input name="slot" list="banner-slots" defaultValue="home_hero" required className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
            </label>
            <label className="text-sm">
              {t("order", locale)}
              <input name="sortOrder" type="number" defaultValue="0" className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
            </label>
            <label className="flex items-end gap-2 rounded-lg border border-black/10 px-3 py-3 text-sm">
              <input name="active" type="checkbox" defaultChecked className="accent-black" />
              {t("active", locale)}
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {textField(t("titleUk", locale), "title_uk", "", true)}
            {textField(t("titleRu", locale), "title_ru")}
            {textField(t("titleEn", locale), "title_en")}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {textField(t("subtitleUk", locale), "subtitle_uk")}
            {textField(t("subtitleRu", locale), "subtitle_ru")}
            {textField(t("subtitleEn", locale), "subtitle_en")}
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            {textField(t("href", locale), "href", "/catalog", true)}
            {textField(t("image", locale), "image", "", true)}
          </div>
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-accent sm:w-auto">
            <Save size={17} />
            {c("save", locale)}
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {banners.length === 0 && <div className="rounded-lg border border-black/10 bg-white p-5 text-sm text-graphite/60 shadow-card">{t("empty", locale)}</div>}
        {banners.map((banner) => (
          <article key={banner.id} className="grid gap-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-card lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="relative min-h-56 bg-ink text-white">
              {banner.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" decoding="async" />
              ) : (
                <div className="grid h-full min-h-56 place-items-center text-white/35">
                  <ImageIcon size={34} />
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,20,0.12),rgba(17,18,20,0.76))]" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-white/65">
                  <LayoutPanelTop size={14} />
                  {banner.slot}
                </div>
                <div className="line-clamp-2 font-semibold">{tJson(banner.title, locale)}</div>
                {banner.subtitle && <div className="mt-1 line-clamp-2 text-xs text-white/70">{tJson(banner.subtitle, locale)}</div>}
              </div>
            </div>
            <form action={saveBanner} className="grid gap-4 p-5">
              <input type="hidden" name="id" value={banner.id} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold">
                  <Eye size={18} />
                  {t("preview", locale)}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${banner.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-graphite/55"}`}>
                  {banner.active ? t("active", locale) : "-"}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_140px]">
                <label className="text-sm">
                  {t("slot", locale)}
                  <input name="slot" list="banner-slots" defaultValue={banner.slot} required className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
                </label>
                <label className="text-sm">
                  {t("order", locale)}
                  <input name="sortOrder" type="number" defaultValue={banner.sortOrder} className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
                </label>
                <label className="flex items-end gap-2 rounded-lg border border-black/10 px-3 py-3 text-sm">
                  <input name="active" type="checkbox" defaultChecked={banner.active} className="accent-black" />
                  {t("active", locale)}
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {textField(t("titleUk", locale), "title_uk", localizedValue(banner.title, "uk"), true)}
                {textField(t("titleRu", locale), "title_ru", localizedValue(banner.title, "ru"))}
                {textField(t("titleEn", locale), "title_en", localizedValue(banner.title, "en"))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {textField(t("subtitleUk", locale), "subtitle_uk", localizedValue(banner.subtitle, "uk"))}
                {textField(t("subtitleRu", locale), "subtitle_ru", localizedValue(banner.subtitle, "ru"))}
                {textField(t("subtitleEn", locale), "subtitle_en", localizedValue(banner.subtitle, "en"))}
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                {textField(t("href", locale), "href", banner.href, true)}
                {textField(t("image", locale), "image", banner.image, true)}
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-accent">
                  <Save size={17} />
                  {c("save", locale)}
                </button>
                <button
                  formAction={deleteBanner}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 size={17} />
                  {c("delete", locale)}
                </button>
              </div>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
