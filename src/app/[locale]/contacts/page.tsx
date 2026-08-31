import { siteSettings } from "@/lib/settings";
import { normalizeLocale, tr } from "@/lib/localization";

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
      {sent && <p className="mt-8 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{tr(COPY.sent, locale)}</p>}
      <form className="mt-10 grid gap-3" action="/api/contact" method="post">
        <input name="name" required placeholder={tr(COPY.name, locale)} className="rounded-xl border px-4 py-3" />
        <input name="email" type="email" required placeholder={tr(COPY.replyEmail, locale)} className="rounded-xl border px-4 py-3" />
        <textarea name="message" required placeholder={tr(COPY.message, locale)} className="rounded-xl border px-4 py-3" rows={5} />
        <button className="rounded-full bg-ink py-3 text-white">{tr(COPY.submit, locale)}</button>
      </form>
    </div>
  );
}
