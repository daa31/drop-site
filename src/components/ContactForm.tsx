"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { honeypotField, HONEYPOT_NAME } from "@/lib/honeypot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SENT_LABEL = "sent=1";

const COPY = {
  name: { uk: "Ім'я", ru: "Имя", en: "Name" },
  replyEmail: { uk: "Email для відповіді", ru: "Email для ответа", en: "Email for reply" },
  message: { uk: "Повідомлення", ru: "Сообщение", en: "Message" },
  submit: { uk: "Надіслати", ru: "Отправить", en: "Send" },
  required: { uk: "Підтвердіть, що ви не робот.", ru: "Подтвердите, что вы не робот.", en: "Please confirm you are not a robot." },
};

export function ContactForm({ sent }: { sent: boolean }) {
  const locale = useLocale();
  const t = (o: Record<string, string>) => o[locale] || o.uk;
  const [token, setToken] = useState<string | null>(null);
  const turnstileRequired = TURNSTILE_SITE_KEY.length > 0;

  return (
    <div>
      {sent && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{t(SENT_OK)}</p>}
      <form
        className="mt-4 grid gap-3"
        method="post"
        action="/api/contact"
        onSubmit={(e) => {
          if (turnstileRequired && !token) {
            e.preventDefault();
            return;
          }
          /* let the native form post; honeypot + token ride along in hidden inputs */
        }}
      >
        {honeypotField()}
        <input name="name" required placeholder={t(COPY.name)} className="rounded-xl border px-4 py-3" />
        <input name="email" type="email" required placeholder={t(COPY.replyEmail)} className="rounded-xl border px-4 py-3" />
        <textarea name="message" required placeholder={t(COPY.message)} className="rounded-xl border px-4 py-3" rows={5} />
        {turnstileRequired && (
          <>
            <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onToken={setToken} />
            {!token && turnstileRequired && (
              <p className="text-xs text-red-600">{t(COPY.required)}</p>
            )}
            <input type="hidden" name="turnstileToken" value={token || ""} />
          </>
        )}
        <button type="submit" className="rounded-full bg-ink py-3 text-white">{t(COPY.submit)}</button>
      </form>
    </div>
  );
}

const SENT_OK = {
  uk: "Дякуємо! Ваше повідомлення надіслано.",
  ru: "Спасибо! Ваше сообщение отправлено.",
  en: "Thank you! Your message has been sent.",
};
