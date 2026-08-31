"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

type Mode = "login" | "reg";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function localCopy(locale: string) {
  if (locale === "ru") {
    return {
      identifier: "Email или логин",
      emailPlaceholder: "email@example.com",
      name: "Имя",
      phone: "Телефон",
      phonePlaceholder: "+380 (__) ___-__-__",
      optional: "необязательно",
      required: "обязательно",
      error: "Проверьте email/логин и пароль.",
      invalid: "Заполните имя, введите корректный email и пароль не короче 4 символов.",
      invalidIdentifier: "Нужен корректный email.",
      exists: "Такой email или логин уже зарегистрирован.",
      sending: "Отправляем...",
    };
  }
  if (locale === "en") {
    return {
      identifier: "Email or login",
      emailPlaceholder: "email@example.com",
      name: "Name",
      phone: "Phone",
      phonePlaceholder: "+380 (__) ___-__-__",
      optional: "optional",
      required: "required",
      error: "Check your email/login and password.",
      invalid: "Fill in a name, a valid email and a password of at least 4 characters.",
      invalidIdentifier: "A valid email is required.",
      exists: "This email or login is already registered.",
      sending: "Sending...",
    };
  }
  return {
    identifier: "Email або логін",
    emailPlaceholder: "email@example.com",
    name: "Ім'я",
    phone: "Телефон",
    phonePlaceholder: "+380 (__) ___-__-__",
    optional: "необов'язково",
    required: "обов'язково",
    error: "Перевірте email/логін і пароль.",
    invalid: "Заповніть ім'я, вкажіть коректний email і пароль не коротший за 4 символи.",
    invalidIdentifier: "Потрібен коректний email.",
    exists: "Такий email або логін уже зареєстрований.",
    sending: "Надсилаємо...",
  };
}

function formatPhoneMask(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("380")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  const d1 = digits.slice(0, 2);
  const d2 = digits.slice(2, 5);
  const d3 = digits.slice(5, 7);
  const d4 = digits.slice(7, 9);
  let out = "+380";
  if (d1) out += ` (${d1}`;
  if (d2) out += `) ${d2}`;
  if (d3) out += `-${d3}`;
  if (d4) out += `-${d4}`;
  return out;
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const copy = localCopy(locale);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState("");

  async function register(email: string, data: { name: string; phone: string; password: string }) {
    setSending(true);
    setErr("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, locale, ...data }),
    });
    const body = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      if (body.error === "exists") setErr(copy.exists);
      else if (body.error === "invalid_identifier") setErr(copy.invalidIdentifier);
      else setErr(copy.invalid);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  const inputClass = "h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none focus:border-ink";
  const labelClass = "mb-1 block text-xs font-medium text-graphite/60";
  const requiredMark = <span className="text-red-600">*</span>;

  function FieldLabel({ text, required }: { text: string; required?: boolean }) {
    return (
      <label className={labelClass}>
        {text} {required ? requiredMark : <span className="text-graphite/40">({copy.optional})</span>}
      </label>
    );
  }

  return (
    <div className="container-f max-w-md py-16">
      <h1 className="font-display text-3xl">{mode === "login" ? t("login") : t("register")}</h1>
      <form
        className="mt-8 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (mode === "login") {
            void (async () => {
              setErr("");
              setSending(true);
              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: fd.get("identifier"), password: fd.get("password") }),
              });
              const data = await res.json().catch(() => ({}));
              setSending(false);
              if (!res.ok) {
                setErr(data.error === "invalid_identifier" ? copy.invalidIdentifier : copy.error);
                return;
              }
              router.push("/account");
              router.refresh();
            })();
            return;
          }
          const email = String(fd.get("identifier") || "").trim();
          const name = String(fd.get("name") || "").trim();
          const phoneValue = String(fd.get("phone") || "").replace(/\D/g, "");
          const password = String(fd.get("password") || "");
          if (!EMAIL_RE.test(email) || name.length < 2 || password.length < 4) {
            setErr(copy.invalid);
            return;
          }
          void register(email, { name, phone: phoneValue, password });
        }}
      >
        {mode === "reg" && (
          <div>
            <FieldLabel text={copy.name} required />
            <input name="name" required placeholder={copy.name} className={inputClass} />
          </div>
        )}
        <div>
          <FieldLabel text={copy.identifier} required />
          <input name="identifier" required placeholder={mode === "reg" ? copy.emailPlaceholder : copy.identifier} className={inputClass} />
        </div>
        {mode === "reg" && (
          <div>
            <FieldLabel text={copy.phone} />
            <input
              name="phone"
              value={phone}
              onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
              onFocus={(event) => {
                if (!event.target.value) setPhone("+380 (");
              }}
              placeholder={copy.phonePlaceholder}
              inputMode="tel"
              maxLength={19}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <FieldLabel text={t("password")} required />
          <input name="password" type="password" required placeholder={t("password")} className={inputClass} />
        </div>
        {err && <p className="text-sm text-[#dc2626]">{err}</p>}
        <button disabled={sending} className="rounded-full bg-ink py-3 text-white disabled:opacity-60">
          {sending && mode === "reg" ? copy.sending : mode === "login" ? t("submit") : t("create")}
        </button>
      </form>
      <button
        className="mt-4 text-sm underline"
        onClick={() => {
          setErr("");
          setMode(mode === "login" ? "reg" : "login");
        }}
      >
        {mode === "login" ? t("create") : t("login")}
      </button>
    </div>
  );
}