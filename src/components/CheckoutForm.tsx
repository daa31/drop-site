"use client";

import { Building2, CreditCard, LoaderCircle, MapPin, MessageCircle, MessageSquare, Package, Truck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { honeypotField, HONEYPOT_NAME } from "@/lib/honeypot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type FieldName = "name" | "surname" | "patronymic" | "phone" | "email" | "telegram" | "city" | "warehouse" | "agree";
type FieldErrors = Partial<Record<FieldName, string>>;
type CityOption = { name: string; ref?: string; area?: string };
type DeliveryMethod = "nova_poshta_branch" | "nova_poshta_locker";
type WarehouseOption = { name: string; ref?: string; category?: string; number?: string; address?: string };

const DEFAULT_CITIES = [
  { uk: "Київ", ru: "Киев", en: "Kyiv" },
  { uk: "Харків", ru: "Харьков", en: "Kharkiv" },
  { uk: "Одеса", ru: "Одесса", en: "Odesa" },
  { uk: "Дніпро", ru: "Днепр", en: "Dnipro" },
  { uk: "Львів", ru: "Львов", en: "Lviv" },
  { uk: "Запоріжжя", ru: "Запорожье", en: "Zaporizhzhia" },
  { uk: "Вінниця", ru: "Винница", en: "Vinnytsia" },
  { uk: "Полтава", ru: "Полтава", en: "Poltava" },
  { uk: "Черкаси", ru: "Черкассы", en: "Cherkasy" },
  { uk: "Чернігів", ru: "Чернигов", en: "Chernihiv" },
  { uk: "Суми", ru: "Сумы", en: "Sumy" },
  { uk: "Житомир", ru: "Житомир", en: "Zhytomyr" },
  { uk: "Рівне", ru: "Ровно", en: "Rivne" },
  { uk: "Луцьк", ru: "Луцк", en: "Lutsk" },
  { uk: "Тернопіль", ru: "Тернополь", en: "Ternopil" },
  { uk: "Івано-Франківськ", ru: "Ивано-Франковск", en: "Ivano-Frankivsk" },
  { uk: "Хмельницький", ru: "Хмельницкий", en: "Khmelnytskyi" },
  { uk: "Чернівці", ru: "Черновцы", en: "Chernivtsi" },
  { uk: "Ужгород", ru: "Ужгород", en: "Uzhhorod" },
  { uk: "Миколаїв", ru: "Николаев", en: "Mykolaiv" },
  { uk: "Кривий Ріг", ru: "Кривой Рог", en: "Kryvyi Rih" },
  { uk: "Кропивницький", ru: "Кропивницкий", en: "Kropyvnytskyi" },
  { uk: "Херсон", ru: "Херсон", en: "Kherson" },
  { uk: "Маріуполь", ru: "Мариуполь", en: "Mariupol" },
  { uk: "Біла Церква", ru: "Белая Церковь", en: "Bila Tserkva" },
  { uk: "Кременчук", ru: "Кременчуг", en: "Kremenchuk" },
  { uk: "Кам'янець-Подільський", ru: "Каменец-Подольский", en: "Kamianets-Podilskyi" },
  { uk: "Сєвєродонецьк", ru: "Северодонецк", en: "Sievierodonetsk" },
  { uk: "Лисичанськ", ru: "Лисичанск", en: "Lysychansk" },
  { uk: "Умань", ru: "Умань", en: "Uman" },
  { uk: "Нікополь", ru: "Никополь", en: "Nikopol" },
];

function cityName(city: (typeof DEFAULT_CITIES)[number], locale: string) {
  if (locale === "ru") return city.ru;
  if (locale === "en") return city.en;
  return city.uk;
}

function normalizeCity(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/ї/g, "і")
    .replace(/['’`-]/g, "")
    .trim();
}

function formatPhoneMask(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("380")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  let out = "+380";
  if (digits.length >= 2) out += ` (${digits.slice(0, 2)}`;
  else if (digits.length === 1) out += ` (${digits[0]}`;
  if (digits.length >= 5) out += `) ${digits.slice(2, 5)}`;
  else if (digits.length > 2) out += `) ${digits.slice(2)}`;
  if (digits.length >= 7) out += `-${digits.slice(5, 7)}`;
  else if (digits.length > 5) out += `-${digits.slice(5)}`;
  if (digits.length >= 9) out += `-${digits.slice(7, 9)}`;
  else if (digits.length > 7) out += `-${digits.slice(7)}`;
  return out;
}

function fallbackCities(locale: string, query: string): CityOption[] {
  const q = normalizeCity(query);
  return DEFAULT_CITIES.filter((city) => {
    if (!q) return true;
    return [city.uk, city.ru, city.en].some((value) => normalizeCity(value).includes(q));
  })
    .slice(0, 10)
    .map((city) => ({ name: cityName(city, locale) }));
}

function mergeCities(primary: CityOption[], fallback: CityOption[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((city) => {
    const key = `${normalizeCity(city.name)}:${normalizeCity(city.area || "")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function localCopy(locale: string) {
  if (locale === "ru") {
    return {
      contacts: "Контакты получателя",
      shipping: "Куда отправлять",
      payment: "Оплата и комментарий",
      deliveryType: "Новая почта: тип доставки",
      telegram: "Telegram",
      optional: "необязательно",
      noTelegramContact: "Не связываться со мной",
      branch: "Отделение",
      locker: "Почтомат",
      selectCityFirst: "Сначала выберите город из списка Новой почты",
      warehouseLoading: "Загружаем варианты...",
      noWarehouses: "Ничего не нашли. Попробуйте уточнить запрос или введите адрес вручную.",
      emptyCart: "Корзина пустая. Добавьте товар и вернитесь к оформлению.",
      unavailable: "Один из товаров недоступен. Обновите корзину и попробуйте снова.",
      server: "Не удалось оформить заказ. Проверьте данные и попробуйте еще раз.",
      invalid: {
        name: "Введите имя минимум из 2 символов.",
        surname: "Введите фамилию.",
        patronymic: "Введите отчество.",
        phone: "Введите телефон минимум из 10 символов.",
        email: "Введите корректный email или оставьте поле пустым.",
        city: "Введите город.",
        warehouse: "Введите отделение или почтомат.",
        telegram: "Укажите Telegram или включите «Не связываться со мной».",
        agree: "Нужно согласиться с условиями.",
        turnstile: "Подтвердите, что вы не робот.",
      },
    };
  }
  if (locale === "en") {
    return {
      contacts: "Recipient contacts",
      shipping: "Shipping destination",
      payment: "Payment and comment",
      deliveryType: "Nova Poshta: delivery type",
      telegram: "Telegram",
      optional: "optional",
      noTelegramContact: "Don't contact me",
      branch: "Branch",
      locker: "Parcel locker",
      selectCityFirst: "Select a Nova Poshta city first",
      warehouseLoading: "Loading options...",
      noWarehouses: "Nothing found. Try a more specific query or enter the address manually.",
      emptyCart: "Your cart is empty. Add a product and return to checkout.",
      unavailable: "One product is unavailable. Refresh the cart and try again.",
      server: "Could not place the order. Check the data and try again.",
      invalid: {
        name: "Enter a name with at least 2 characters.",
        surname: "Enter your last name.",
        patronymic: "Enter your patronymic.",
        phone: "Enter a phone number with at least 10 characters.",
        email: "Enter a valid email or leave it empty.",
        city: "Enter a city.",
        warehouse: "Enter a branch or parcel locker.",
        telegram: "Enter your Telegram or enable \"Don't contact me\".",
        agree: "You need to accept the terms.",
        turnstile: "Please confirm you are not a robot.",
      },
    };
  }
  return {
    contacts: "Контакти отримувача",
    shipping: "Куди відправляти",
    payment: "Оплата і коментар",
    deliveryType: "Нова пошта: тип доставки",
    telegram: "Telegram",
    optional: "необов'язково",
    noTelegramContact: "Не зв'язуватись зі мною",
    branch: "Відділення",
    locker: "Поштомат",
    selectCityFirst: "Спочатку оберіть місто зі списку Нової пошти",
    warehouseLoading: "Завантажуємо варіанти...",
    noWarehouses: "Нічого не знайшли. Уточніть запит або введіть адресу вручну.",
    emptyCart: "Кошик порожній. Додайте товар і поверніться до оформлення.",
    unavailable: "Один із товарів недоступний. Оновіть кошик і спробуйте ще раз.",
    server: "Не вдалося оформити замовлення. Перевірте дані та спробуйте ще раз.",
    invalid: {
      name: "Введіть ім'я мінімум з 2 символів.",
      surname: "Введіть прізвище.",
      patronymic: "Введіть по батькові.",
      phone: "Введіть телефон мінімум з 10 символів.",
      email: "Введіть коректний email або залиште поле порожнім.",
      city: "Введіть місто.",
      warehouse: "Введіть відділення або поштомат.",
      telegram: "Вкажіть Telegram або увімкніть «Не зв'язуватись зі мною».",
      agree: "Потрібно погодитися з умовами.",
      turnstile: "Підтвердіть, що ви не робот.",
    },
  };
}

export function CheckoutForm({ locale = "uk" }: { locale?: string }) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const warehouseInputRef = useRef<HTMLInputElement>(null);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [city, setCity] = useState("");
  const [cityRef, setCityRef] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>(() => fallbackCities(locale, ""));
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("nova_poshta_branch");
  const [warehouse, setWarehouse] = useState("");
  const [warehouseRef, setWarehouseRef] = useState("");
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);
  const [showWarehouseOptions, setShowWarehouseOptions] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [noContact, setNoContact] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRequired = TURNSTILE_SITE_KEY.length > 0;
  const [phone, setPhone] = useState("");
  const copy = localCopy(locale);

  const field =
    "h-12 rounded-lg border border-black/10 bg-white px-4 text-sm outline-none focus:border-ink aria-[invalid=true]:border-red-500 aria-[invalid=true]:bg-red-50";
  const errorClass = "mt-1 text-xs font-medium text-red-700";

  function validate(fd: FormData, noContactValue: boolean) {
    const next: FieldErrors = {};
    const name = String(fd.get("name") || "").trim();
    const surname = String(fd.get("surname") || "").trim();
    const patronymic = String(fd.get("patronymic") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const telegram = String(fd.get("telegram") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const warehouse = String(fd.get("warehouse") || "").trim();
    const agree = fd.get("agree") === "on";

    if (name.length < 2) next.name = copy.invalid.name;
    if (!surname) next.surname = copy.invalid.surname;
    if (!patronymic) next.patronymic = copy.invalid.patronymic;
    if (phone.replace(/\D/g, "").length < 10) next.phone = copy.invalid.phone;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = copy.invalid.email;
    if (!noContactValue && !telegram) next.telegram = copy.invalid.telegram;
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

  function selectCity(option: CityOption) {
    setCity(option.name);
    setCityRef(option.ref || "");
    setWarehouse("");
    setWarehouseRef("");
    setWarehouseOptions([]);
    setShowWarehouseOptions(true);
    setShowCityOptions(false);
    window.setTimeout(() => warehouseInputRef.current?.focus(), 0);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.city;
      return next;
    });
  }

  function selectWarehouse(option: WarehouseOption) {
    setWarehouse(option.name);
    setWarehouseRef(option.ref || "");
    setShowWarehouseOptions(false);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.warehouse;
      return next;
    });
  }

  useEffect(() => {
    const query = city.trim();
    const fallback = fallbackCities(locale, query);
    if (query.length < 2) {
      setCityOptions(fallback);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/np?city=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        const remote = Array.isArray(data.cities)
          ? data.cities
              .map((item: Record<string, string>) => ({
                name: locale === "ru" ? item.DescriptionRu || item.Description : item.Description,
                ref: item.Ref,
                area: locale === "ru" ? item.AreaDescriptionRu || item.AreaDescription : item.AreaDescription,
              }))
              .filter((item: CityOption) => item.name)
              .slice(0, 10)
          : [];
        setCityOptions(mergeCities(remote, fallback).slice(0, 10));
      } catch {
        if (!controller.signal.aborted) setCityOptions(fallback);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, locale]);

  useEffect(() => {
    if (!cityRef) {
      setWarehouseOptions([]);
      setWarehouseLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setWarehouseLoading(true);
      try {
        const type = deliveryMethod === "nova_poshta_locker" ? "locker" : "branch";
        const params = new URLSearchParams({ cityRef, type, q: warehouse.trim() });
        const res = await fetch(`/api/np?${params.toString()}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        const remote = Array.isArray(data.warehouses)
          ? data.warehouses
              .map((item: Record<string, string>) => ({
                name: locale === "ru" ? item.DescriptionRu || item.Description : item.Description,
                ref: item.Ref,
                category: item.CategoryOfWarehouse,
                number: item.Number,
                address: item.ShortAddress,
              }))
              .filter((item: WarehouseOption) => item.name)
              .slice(0, 80)
          : [];
        setWarehouseOptions(remote);
      } catch {
        if (!controller.signal.aborted) setWarehouseOptions([]);
      } finally {
        if (!controller.signal.aborted) setWarehouseLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityRef, deliveryMethod, locale, showWarehouseOptions, warehouse]);

  return (
    <form
      ref={formRef}
      noValidate
      className="mt-8 grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        setGeneralError("");
        setFieldErrors({});
        const fd = new FormData(e.currentTarget);
        const clientErrors = validate(fd, noContact);
        if (Object.keys(clientErrors).length) {
          setFieldErrors(clientErrors);
          focusFirstError(clientErrors);
          return;
        }
        if (turnstileRequired && !turnstileToken) {
          setGeneralError(copy.invalid.turnstile || copy.server);
          return;
        }

        setSubmitting(true);
        let keepButtonLocked = false;
        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              surname: fd.get("surname"),
              patronymic: fd.get("patronymic"),
              phone: fd.get("phone"),
              email: fd.get("email"),
              city: fd.get("city"),
              deliveryMethod: fd.get("deliveryMethod"),
              cityRef: fd.get("cityRef"),
              warehouse: fd.get("warehouse"),
              warehouseRef: fd.get("warehouseRef"),
              telegram: fd.get("telegram") || "",
              noContact,
              paymentMethod: fd.get("paymentMethod"),
              comment: fd.get("comment"),
              locale,
              agree: fd.get("agree") === "on",
              [HONEYPOT_NAME]: fd.get(HONEYPOT_NAME) || "",
              turnstileToken,
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
          keepButtonLocked = true;
          router.push(`/checkout/success?n=${data.number}&t=${data.publicToken || ""}`, { locale });
        } catch {
          setGeneralError(copy.server);
        } finally {
          if (!keepButtonLocked) setSubmitting(false);
        }
      }}
    >
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <User size={18} />
          {copy.contacts}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <input name="name" placeholder={t("name")} aria-invalid={Boolean(fieldErrors.name)} className={`${field} w-full`} />
            {errorFor("name")}
          </div>
          <div>
            <input name="surname" placeholder={t("surname")} aria-invalid={Boolean(fieldErrors.surname)} className={`${field} w-full`} />
            {errorFor("surname")}
          </div>
          <div>
            <input name="patronymic" placeholder={t("patronymic")} aria-invalid={Boolean(fieldErrors.patronymic)} className={`${field} w-full`} />
            {errorFor("patronymic")}
          </div>
          <div className="sm:col-span-3">
            <input
              name="phone"
              type="tel"
              placeholder="+380 (__) ___-__-__"
              value={phone}
              onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
              onFocus={() => {
                if (!phone) setPhone("+380 (");
              }}
              maxLength={19}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              className={`${field} w-full`}
            />
            {errorFor("phone")}
          </div>
          <div className="sm:col-span-3">
            <input name="email" type="email" placeholder={t("email")} aria-invalid={Boolean(fieldErrors.email)} className={`${field} w-full`} />
            {errorFor("email")}
          </div>
<div className="sm:col-span-2">
            <div className="mb-1 text-xs font-medium">
              {noContact ? <span className="text-graphite/50">{copy.telegram} ({copy.optional})</span> : <span className="text-red-600">{copy.telegram} *</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="relative">
                <MessageCircle className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/40" size={17} />
                <input
                  name="telegram"
                  placeholder={noContact ? `${copy.telegram} — ${copy.optional}` : copy.telegram}
                  disabled={noContact}
                  aria-invalid={Boolean(fieldErrors.telegram)}
                  className={`${field} w-full pl-11 ${noContact ? "bg-mist/60 opacity-60" : ""}`}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-graphite/60">
                <input
                  type="checkbox"
                  name="noContact"
                  className="h-4 w-4 accent-black"
                  checked={noContact}
                  onChange={(event) => {
                    setNoContact(event.target.checked);
                    setFieldErrors((current) => {
                      const next = { ...current };
                      delete next.telegram;
                      return next;
                    });
                  }}
                />
                {copy.noTelegramContact}
              </label>
            </div>
            {errorFor("telegram")}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <Truck size={18} />
          {copy.shipping}
        </div>
        <div className="grid gap-3">
          <div>
            <div className="mb-2 text-xs font-medium text-graphite/55">{copy.deliveryType}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod("nova_poshta_branch");
                  setWarehouse("");
                  setWarehouseRef("");
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.warehouse;
                    return next;
                  });
                }}
                aria-pressed={deliveryMethod === "nova_poshta_branch"}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${
                  deliveryMethod === "nova_poshta_branch"
                    ? "border-ink bg-ink text-white"
                    : "border-black/10 bg-white text-graphite/70 hover:border-ink"
                }`}
              >
                <Building2 size={16} />
                {copy.branch}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeliveryMethod("nova_poshta_locker");
                  setWarehouse("");
                  setWarehouseRef("");
                  setFieldErrors((current) => {
                    const next = { ...current };
                    delete next.warehouse;
                    return next;
                  });
                }}
                aria-pressed={deliveryMethod === "nova_poshta_locker"}
                className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition ${
                  deliveryMethod === "nova_poshta_locker"
                    ? "border-ink bg-ink text-white"
                    : "border-black/10 bg-white text-graphite/70 hover:border-ink"
                }`}
              >
                <Package size={16} />
                {copy.locker}
              </button>
            </div>
            <input type="hidden" name="deliveryMethod" value={deliveryMethod} />
          </div>
          <div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-graphite/40" size={17} />
              <input
                name="city"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setCityRef("");
                  setShowCityOptions(true);
                }}
                onFocus={() => setShowCityOptions(true)}
                onBlur={() => {
                  window.setTimeout(() => setShowCityOptions(false), 120);
                  if (!cityRef && city.trim()) {
                    const match = cityOptions.find((o) => o.ref && normalizeCity(o.name) === normalizeCity(city));
                    if (match) selectCity(match);
                  }
                }}
                placeholder={t("city")}
                aria-invalid={Boolean(fieldErrors.city)}
                aria-expanded={showCityOptions && cityOptions.length > 0}
                aria-controls="checkout-city-list"
                role="combobox"
                autoComplete="off"
                className={`${field} w-full pl-11`}
              />
              <input type="hidden" name="cityRef" value={cityRef} />
              {showCityOptions && cityOptions.length > 0 && (
                <div
                  id="checkout-city-list"
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-64 overflow-auto rounded-lg border border-black/10 bg-white py-2 text-sm shadow-card"
                >
                  {cityOptions.map((option) => (
                    <button
                      key={`${option.name}-${option.ref || option.area || "local"}`}
                      type="button"
                      role="option"
                      aria-selected={city === option.name}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCity(option)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-mist"
                    >
                      <span className="font-medium">{option.name}</span>
                      {option.area && <span className="text-xs text-graphite/50">{option.area}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errorFor("city")}
          </div>
          <div>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                {warehouseLoading ? (
                  <LoaderCircle size={17} className="animate-spin text-graphite/40" />
                ) : (
                  deliveryMethod === "nova_poshta_locker" ? (
                    <Package size={17} className="text-graphite/40" />
                  ) : (
                    <Building2 size={17} className="text-graphite/40" />
                  )
                )}
              </div>
              <input
                name="warehouse"
                ref={warehouseInputRef}
                value={warehouse}
                onChange={(event) => {
                  setWarehouse(event.target.value);
                  setWarehouseRef("");
                  setShowWarehouseOptions(true);
                }}
                onFocus={() => {
                  if (cityRef) setShowWarehouseOptions(true);
                }}
                onBlur={() => window.setTimeout(() => setShowWarehouseOptions(false), 150)}
                placeholder={t("warehouse")}
                aria-invalid={Boolean(fieldErrors.warehouse)}
                aria-expanded={showWarehouseOptions && warehouseOptions.length > 0}
                aria-controls="checkout-warehouse-list"
                role="combobox"
                autoComplete="off"
                className={`${field} w-full pl-11`}
              />
              <input type="hidden" name="warehouseRef" value={warehouseRef} />
              {showWarehouseOptions && warehouseOptions.length > 0 && (
                <div
                  id="checkout-warehouse-list"
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-64 overflow-auto rounded-lg border border-black/10 bg-white py-2 text-sm shadow-card"
                >
                  {warehouseOptions.map((option) => (
                    <button
                      key={`${option.ref || option.name}-${option.category || "wh"}`}
                      type="button"
                      role="option"
                      aria-selected={warehouse === option.name}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectWarehouse(option)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-mist"
                    >
                      <span className="shrink-0 text-graphite/40">
                        {deliveryMethod === "nova_poshta_locker" ? <Package size={15} /> : <Building2 size={15} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{option.number ? `№${option.number}` : ""} {option.name}</span>
                        {option.address && <span className="block truncate text-xs text-graphite/50">{option.address}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!cityRef && (
              <p className="mt-1 text-xs text-graphite/50">{copy.selectCityFirst}</p>
            )}
            {cityRef && warehouseLoading && warehouseOptions.length === 0 && !warehouse && (
              <p className="mt-1 text-xs text-graphite/50">{copy.warehouseLoading}</p>
            )}
            {cityRef && showWarehouseOptions && warehouseOptions.length === 0 && !warehouseLoading && (
              <p className="mt-1 text-xs text-graphite/50">{copy.noWarehouses}</p>
            )}
            {errorFor("warehouse")}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2 font-semibold">
          <CreditCard size={18} />
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
      {honeypotField()}
      {turnstileRequired && (
        <div>
          <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
          {!turnstileToken && generalError && (
            <p className="mt-1 text-xs text-red-600">{copy.invalid.turnstile}</p>
          )}
        </div>
      )}
      {generalError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{generalError}</p>}
      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-white transition ${
          submitting ? "cursor-wait bg-graphite/35" : "bg-accent hover:bg-accentHover"
        }`}
      >
        {submitting && <LoaderCircle size={18} className="animate-spin" />}
        {t("submit")}
      </button>
    </form>
  );
}
