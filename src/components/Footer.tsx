import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer({
  locale,
  settings,
}: {
  locale: string;
  settings: Record<string, string>;
}) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const f = await getTranslations({ locale, namespace: "footer" });
  const legal = await getTranslations({ locale, namespace: "legal" });
  return (
    <footer className="mt-20 border-t border-black/5 bg-white">
      <div className="container-f grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="font-display text-lg tracking-[0.2em]">Locko</div>
          <p className="mt-3 max-w-xs text-sm text-graphite/70">{f("copy")}</p>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-medium">{t("catalog")}</div>
          <div className="grid gap-2 text-graphite/80">
            <Link href="/catalog">{t("catalog")}</Link>
            <Link href="/guide">{t("guide")}</Link>
            <Link href="/optics">{t("optics")}</Link>
            <Link href="/brands">{t("brands")}</Link>
          </div>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-medium">{t("delivery")}</div>
          <div className="grid gap-2 text-graphite/80">
            <Link href="/delivery">{t("delivery")}</Link>
            <Link href="/faq">{t("faq")}</Link>
            <Link href="/contacts">{t("contacts")}</Link>
          </div>
        </div>
        <div className="text-sm text-graphite/80">
          <div>{settings.phone}</div>
          <div>{settings.email}</div>
          <div>{settings.telegram}</div>
          <div className="mt-2">{settings.hours}</div>
        </div>
      </div>
      <div className="container-f flex flex-wrap gap-4 border-t border-black/5 py-5 text-xs text-graphite/60">
        <span>© {new Date().getFullYear()} Locko</span>
        <Link href="/privacy">{legal("privacy")}</Link>
        <Link href="/terms">{legal("terms")}</Link>
      </div>
    </footer>
  );
}
