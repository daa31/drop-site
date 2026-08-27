"use client";

import { MapPin, MessageCircle, MessageSquare, Phone, Truck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";

type FieldName = "name" | "phone" | "email" | "city" | "warehouse" | "agree";
type FieldErrors = Partial<Record<FieldName, string>>;

function localCopy(locale: string) {
  if (locale === "ru") {
    return {
      contacts: "Контакты получателя",
      shipping: "Куда отправлять",
      payment: "Оплата и комментарий",
      telegram: "Telegram",
      telegramHint: "Менеджер свяжется с вами в Telegram",
      emptyCart: "Корзина пустая. Добавьте товар и вернитесь к оформлению.",
      unavailable: "Один из товаров недоступен. Обновите корзину и попробуйте снова.",
      server: "Не удалось оформить заказ. Проверьте данные и попробуйте еще раз.",
      invalid: {
        name: "Введите имя минимум из 2 символов.",
        phone: "Введите телефон минимум из 10 символов.",
        email: "Введите корректный email или оставьте поле пустым.",
        city: "Введите город.",
        warehouse: "Введите отделение или почтомат.",
        agree: "Нужно согласиться с условиями.",
      },
    };
  }
  if (locale === "en") {
    return {
      contacts: "Recipient contacts",
      shipping: "Shipping destination",
      payment: "Payment and comment",
      telegram: "Telegram",
      telegramHint: "A manager will contact you in Telegram",
      emptyCart: "Your cart is empty. Add a product and return to checkout.",
      unavailable: "One product is unavailable. Refresh the cart and try again.",
      server: "Could not place the order. Check the data and try again.",
      invalid: {
        name: "Enter a name with at least 2 characters.",
        phone: "Enter a phone number with at least 10 characters.",
        email: "Enter a valid email or leave it empty.",
        city: "Enter a city.",
        warehouse: "Enter a branch or parcel locker.",
        agree: "You need to accept the terms.",
      },
    };
  }
  return {
    contacts: "Контакти отримувача",
    shipping: "Куди відправляти",
    payment: "Оплата і коментар",
    telegram: "Telegram",
    telegramHint: "Менеджер зв'яжеться з вами у Telegram",
    emptyCart: "Кошик порожній. Додайте товар і поверніться до оформлення.",
    unavailable: "Один із товарів недоступний. Оновіть кошик і спробуйте ще раз.",
    server: "Не вдалося оформити замовлення. Перевірте дані та спробуйте ще раз.",
    invalid: {
      name: "Введіть ім'я мінімум з 2 символів.",
      phone: "Введіть телефон мінімум з 10 символів.",
      email: "Введіть коректний email або залиште поле порожнім.",
      city: "Введіть місто.",
      warehouse: "Введіть відділення або поштомат.",
      agree: "Потрібно погодитися з умовами.",
    },
  };
}

export function CheckoutForm({ locale = "uk" }: { locale?: string }) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const copy = localCopy(locale);

  const field =
    "h-12 rounded-lg border border-black/10 bg-white px-4 text-sm outline-none focus:border-ink aria-[invalid=true]:border-red-500 aria-[invalid=true]:bg-red-50";
  const errorClass = "mt-1 text-xs font-medium text-red-700";

  function validate(fd: FormData) {
    const next: FieldErrors = {};
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const warehouse = String(fd.get("warehouse") || "").trim();
    const agree = fd.get("agree") === "on";

    if (name.length < 2) next.name = copy.invalid.name;
    if (phone.replace(/\D/g, "").length < 10) next.phone = copy.invalid.phone;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = copy.invalid.email;
    if (city.length < 2) next.city = copy.invalid.city;
    if (!warehouse) next.warehouse = copy.invalid.warehouse;
    if (!agree) next.agree = copy.invalid.agree;
    return next;
  }

  function focusFirstError(errors: FieldErrors) {
    const first = Object.keys(errors)[0];
    const el = first ? formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`) : null;
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function errorFor(name: FieldName) {
    return fieldErrors[name] ? <p className={errorClass}>{fieldErrors[name]}</p> : null;
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="mt-8 grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setGeneralError("");
        setFieldErrors({});
        const fd = new FormData(e.currentTarget);
        const clientErrors = validate(fd);
        if (Object.keys(clientErrors).length) {
          setFieldErrors(clientErrors);
          focusFirstError(clientErrors);
          return;
        }

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fd.get("name"),
            phone: fd.get("phone"),
            email: fd.get("email"),
            city: fd.get("city"),
            deliveryMethod: fd.get("deliveryMethod"),
            warehouse: fd.get("warehouse"),
            telegram: fd.get("telegram"),
            paymentMethod: fd.get("paymentMethod"),
            comment: fd.get("comment"),
            agree: fd.get("agree") === "on",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.error === "empty_cart") setGeneralError(copy.emptyCart);
          else if (data.error === "product_unavailable") setGeneralError(copy.unavailable);
          else if (data.fieldErrors) {
            const serverErrors: FieldErrors = {};
            for (const key of Object.keys(data.fieldErrors) as FieldName[]) {
              if (key in copy.invalid) serverErrors[key] = copy.invalid[key as keyof typeof copy.invalid];
            }
            setFieldErrors(serverErrors);
            focusFirstError(serverErrors);
          } else setGeneralError(data.error || copy.server);
          return;
        }
        router.push(`/checkout/success?n=${data.number}`, { locale });
      }}
    >
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <User size={18} />
          {copy.contacts}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <input name="name" placeholder={t("name")} aria-invalid={Boolean(fieldErrors.name)} className={`${field} w-full`} />
            {errorFor("name")}
          </div>
          <div>
            <input name="phone" placeholder={t("phone")} aria-invalid={Boolean(fieldErrors.phone)} className={`${field} w-full`} />
            {errorFor("phone")}
          </div>
          <div className="sm:col-span-2">
            <input name="email" type="email" placeholder={t("email")} aria-invalid={Boolean(fieldErrors.email)} className={`${field} w-full`} />
            {errorFor("email")}
          </div>
          <div className="sm:col-span-2">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="relative">
                <MessageCircle className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/40" size={17} />
                <input name="telegram" placeholder={copy.telegram} className={`${field} w-full pl-11`} />
              </div>
              <span className="text-xs font-medium text-graphite/55">{copy.telegramHint}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Truck size={18} />
          {copy.shipping}
        </div>
        <div className="grid gap-3">
          <select name="deliveryMethod" className={field}>
            <option value="nova_poshta">{t("np")}</option>
          </select>
          <div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/40" size={17} />
              <input name="city" placeholder={t("city")} aria-invalid={Boolean(fieldErrors.city)} className={`${field} w-full pl-11`} />
            </div>
            {errorFor("city")}
          </div>
          <div>
            <input name="warehouse" placeholder={t("warehouse")} aria-invalid={Boolean(fieldErrors.warehouse)} className={`${field} w-full`} />
            {errorFor("warehouse")}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Phone size={18} />
          {copy.payment}
        </div>
        <div className="grid gap-3">
          <select name="paymentMethod" className={field}>
            <option value="cod">{t("cod")}</option>
            <option value="online">{t("online")}</option>
          </select>
          <div className="relative">
            <MessageSquare className="pointer-events-none absolute left-4 top-4 text-graphite/40" size={17} />
            <textarea name="comment" placeholder={t("comment")} className="min-h-28 rounded-lg border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-ink" />
          </div>
        </div>
      </section>

      <div>
        <label className="flex items-start gap-2 text-sm text-graphite/70">
          <input type="checkbox" name="agree" className="mt-1 accent-black" />
          {t("agree")}
        </label>
        {errorFor("agree")}
      </div>
      {generalError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{generalError}</p>}
      <button className="rounded-full bg-accent px-6 py-4 text-sm font-semibold text-white transition hover:bg-accentHover">{t("submit")}</button>
    </form>
  );
}
