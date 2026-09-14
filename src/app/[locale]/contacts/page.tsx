import { siteSettings } from "@/lib/settings";
import { normalizeLocale, tr } from "@/lib/localization";
import { ContactForm } from "@/components/ContactForm";
import { buildMetadata } from "@/lib/seo-meta";
import type { Metadata } from "next";

const COPY = {
  title: { uk: "Контакти", ru: "Контакты", en: "Contacts" },
  name: { uk: "Ім'я", ru: "Имя", en: "Name" },
  replyEmail: { uk: "Email для відповіді", ru: "Email для ответа", en: "Email for reply" },
  message: { uk: "Повідомлення", ru: "Сообщение", en: "Message" },
  submit: { uk: "Надіслати", ru: "Отправить", en: "Send" },
  sent: {
    uk: "Дякуємо! Ваше повідомлення надіслано.",
    ru: "Спасибо! Ваше сообщение отправлено.",
    en: "Thank you! Your message has been sent.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({ pageKey: "contacts", descriptionKey: "contacts", path: "/contacts", locale });
}

export default async function Contacts({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const sent = (await searchParams).sent === "1";
  const locale = normalizeLocale(rawLocale);
  const s = await siteSettings();
  return (
    <div className="container-f max-w-xl py-10">
      <h1 className="font-display text-3xl">{tr(COPY.title, locale)}</h1>
      <div className="mt-8 space-y-2 text-graphite/80">
        <p>{s.phone}</p>
        <p>{s.email}</p>
        <p>{s.telegram}</p>
        <p>{s.hours}</p>
      </div>
      <ContactForm sent={sent} />
    </div>
  );
}
