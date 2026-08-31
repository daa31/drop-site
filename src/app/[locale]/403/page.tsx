import { normalizeLocale, tr } from "@/lib/localization";

const COPY = {
  message: { uk: "Немає доступу", ru: "Нет доступа", en: "Access denied" },
};

export default async function Forbidden({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  return (
    <div className="container-f py-20 text-center">
      <h1 className="font-display text-3xl">403</h1>
      <p className="mt-3">{tr(COPY.message, locale)}</p>
    </div>
  );
}
