import { normalizeLocale, tr } from "@/lib/localization";

const COPY = {
  message: {
    uk: "Технічне обслуговування. Поверніться трохи пізніше.",
    ru: "Техническое обслуживание. Вернитесь чуть позже.",
    en: "Maintenance is in progress. Please come back a little later.",
  },
};

export default async function Maintenance({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  return (
    <div className="grid min-h-screen place-items-center bg-mist">
      <div className="text-center">
        <div className="font-display tracking-[0.25em]">Locko</div>
        <p className="mt-4 text-graphite/70">{tr(COPY.message, locale)}</p>
      </div>
    </div>
  );
}
