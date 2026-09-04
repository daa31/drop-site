export const LOCALES = ["uk", "ru", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export function normalizeLocale(locale?: string | null): Locale {
  return LOCALES.includes(locale as Locale) ? (locale as Locale) : "uk";
}

export const LOCALE_LABELS: Record<Locale, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

export const ADMIN_LOCALE_COOKIE = "locko_admin_locale";

export type LocalizedText = Record<Locale, string>;

export function tr(value: LocalizedText, locale?: string | null) {
  return value[normalizeLocale(locale)];
}

export const ORDER_STATUS_ORDER = [
  "new",
  "callback",
  "confirmed",
  "sent_to_supplier",
  "awaiting_shipment",
  "shipped",
  "received",
  "cancelled",
  "return",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_ORDER)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, LocalizedText> = {
  new: { uk: "Нове", ru: "Новый", en: "New" },
  callback: { uk: "Передзвонити", ru: "Созвон", en: "Callback" },
  confirmed: { uk: "Підтверджено", ru: "Подтвержден", en: "Confirmed" },
  sent_to_supplier: { uk: "Передано постачальнику", ru: "Передан поставщику", en: "Sent to supplier" },
  awaiting_shipment: { uk: "Очікує відправлення", ru: "Ждет отправку", en: "Awaiting shipment" },
  shipped: { uk: "Відправлено", ru: "Отправлен", en: "Shipped" },
  received: { uk: "Отримано", ru: "Получен", en: "Received" },
  cancelled: { uk: "Скасовано", ru: "Отменен", en: "Cancelled" },
  return: { uk: "Повернення", ru: "Возврат", en: "Return" },
};

export const CUSTOMER_CANCELABLE_STATUSES = ["new", "callback", "confirmed", "sent_to_supplier"] as const;

export function orderStatusLabel(status: string, locale?: string | null) {
  return ORDER_STATUS_LABELS[status as OrderStatus]?.[normalizeLocale(locale)] || status;
}

export function orderStatusClass(status: string) {
  if (["new", "callback"].includes(status)) return "bg-amber-50 text-amber-800";
  if (["confirmed", "sent_to_supplier", "awaiting_shipment"].includes(status)) return "bg-sky-50 text-sky-800";
  if (["shipped", "received"].includes(status)) return "bg-emerald-50 text-emerald-800";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  return "bg-zinc-100 text-zinc-700";
}

export function formatDateTime(date: Date, locale?: string | null, withYear = true) {
  return new Intl.DateTimeFormat(localeCode(locale), {
    day: "2-digit",
    month: "2-digit",
    year: withYear ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(date: Date | undefined | null, locale?: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat(localeCode(locale), { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
}

export function localeCode(locale?: string | null) {
  const current = normalizeLocale(locale);
  if (current === "uk") return "uk-UA";
  if (current === "ru") return "ru-RU";
  return "en-US";
}

const TEXT_FIXES: Record<Locale, Array<[RegExp, string]>> = {
  uk: [
    [/Очки защитные/gi, "Окуляри захисні"],
    [/Защитные очки/gi, "Захисні окуляри"],
    [/со сменными линзами/gi, "зі змінними лінзами"],
    [/с уплотнителем/gi, "з ущільнювачем"],
    [/салфетка/gi, "серветка"],
    [/бесцветные/gi, "безбарвні"],
    [/песочные/gi, "пісочні"],
    [/черные/gi, "чорні"],
    [/размер/gi, "розмір"],
  ],
  ru: [
    [/Окуляри захисні/gi, "Очки защитные"],
    [/Захисні окуляри/gi, "Защитные очки"],
    [/зі змінними лінзами/gi, "со сменными линзами"],
    [/з ущільнювачем/gi, "с уплотнителем"],
    [/серветка/gi, "салфетка"],
    [/пісочні/gi, "песочные"],
    [/чорні/gi, "черные"],
    [/розмір/gi, "размер"],
  ],
  en: [
    [/Окуляри захисні зі змінними лінзами/gi, "Safety glasses with interchangeable lenses"],
    [/Очки защитные со сменными линзами/gi, "Safety glasses with interchangeable lenses"],
    [/Окуляри захисні з ущільнювачем/gi, "Safety glasses with gasket"],
    [/Очки защитные с уплотнителем/gi, "Safety glasses with gasket"],
    [/Захисні окуляри/gi, "Safety glasses"],
    [/Защитные очки/gi, "Safety glasses"],
    [/Тактичні рукавиці протиударні/gi, "Impact tactical gloves"],
    [/Тактические перчатки противоударные/gi, "Impact tactical gloves"],
    [/Тактичні рукавиці/gi, "Tactical gloves"],
    [/Тактические перчатки/gi, "Tactical gloves"],
    [/пісочні|песочные/gi, "tan"],
    [/чорні|черные/gi, "black"],
    [/розмір|размер/gi, "size"],
    [/спрей від запотівання|спрей от запотевания/gi, "anti-fog spray"],
    [/серветка|салфетка/gi, "wipe"],
    [/пласт\.?\s*флакон/gi, "plastic bottle"],
  ],
};

export function normalizeCatalogText(text: string, locale?: string | null) {
  const current = normalizeLocale(locale);
  return TEXT_FIXES[current].reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
}

export const ACCOUNT_COPY = {
  titleFallback: { uk: "Особистий кабінет", ru: "Личный кабинет", en: "Account" },
  orders: { uk: "Мої замовлення", ru: "Мои заказы", en: "My orders" },
  emptyOrders: { uk: "Поки немає замовлень", ru: "Заказов пока нет", en: "No orders yet" },
  orderNumber: { uk: "Замовлення", ru: "Заказ", en: "Order" },
  tracking: { uk: "ТТН", ru: "ТТН", en: "Tracking" },
  date: { uk: "Дата", ru: "Дата", en: "Date" },
  payment: { uk: "Оплата", ru: "Оплата", en: "Payment" },
  cancel: { uk: "Скасувати", ru: "Отменить", en: "Cancel" },
  cancelTitle: { uk: "Скасувати замовлення?", ru: "Отменить заказ?", en: "Cancel order?" },
  cancelText: {
    uk: "Замовлення залишиться в історії, але його статус зміниться на «Скасовано».",
    ru: "Заказ останется в истории, но его статус изменится на «Отменен».",
    en: "The order will stay in history, but its status will change to Cancelled.",
  },
  confirmCancel: { uk: "Так, скасувати", ru: "Да, отменить", en: "Yes, cancel" },
  keep: { uk: "Ні, залишити", ru: "Нет, оставить", en: "No, keep" },
  actionError: { uk: "Не вдалося виконати дію.", ru: "Не удалось выполнить действие.", en: "Could not complete the action." },
  addData: { uk: "Додати", ru: "Добавить", en: "Add" },
  editData: { uk: "Редагувати", ru: "Редактировать", en: "Edit" },
  save: { uk: "Зберегти", ru: "Сохранить", en: "Save" },
  saveError: { uk: "Не вдалося зберегти. Спробуйте ще раз.", ru: "Не удалось сохранить. Попробуйте ещё раз.", en: "Could not save. Try again." },
  invalidEmail: { uk: "Введіть коректний email.", ru: "Введите корректный email.", en: "Enter a valid email." },
  invalidPhone: { uk: "Введіть коректний номер телефону.", ru: "Введите корректный номер телефона.", en: "Enter a valid phone number." },
  emailTaken: { uk: "Цей email вже використовується.", ru: "Этот email уже используется.", en: "This email is already in use." },
  emailPlaceholder: { uk: "you@example.com", ru: "you@example.com", en: "you@example.com" },
  phonePlaceholder: { uk: "+380 (__) ___-__-__", ru: "+380 (__) ___-__-__", en: "+380 (__) ___-__-__" },
  logout: { uk: "Вийти", ru: "Выйти", en: "Sign out" },
  deleteAccount: { uk: "Видалити акаунт", ru: "Удалить аккаунт", en: "Delete account" },
  deleteTitle: { uk: "Видалити акаунт назавжди?", ru: "Удалить аккаунт навсегда?", en: "Delete account forever?" },
  deleteText: {
    uk: "Особисті дані (адреси, список бажань, повідомлення) буде видалено. Замовлення залишиться в історії без прив'язки до акаунту.",
    ru: "Личные данные (адреса, список желаний, уведомления) будут удалены. Заказы останутся в истории без привязки к аккаунту.",
    en: "Personal data (addresses, wishlist, notifications) will be removed. Orders stay in history without a link to the account.",
  },
  confirmDelete: { uk: "Так, видалити назавжди", ru: "Да, удалить навсегда", en: "Yes, delete forever" },
  cancelDelete: { uk: "Скасувати", ru: "Отмена", en: "Cancel" },
  deleteError: { uk: "Не вдалося видалити акаунт.", ru: "Не удалось удалить аккаунт.", en: "Could not delete the account." },
} satisfies Record<string, LocalizedText>;

export const CHECKOUT_SUMMARY_COPY = {
  title: { uk: "Ваше замовлення", ru: "Ваш заказ", en: "Your order" },
  qty: { uk: "Кількість", ru: "Количество", en: "Quantity" },
  total: { uk: "Разом", ru: "Итого", en: "Total" },
  empty: { uk: "Кошик порожній", ru: "Корзина пустая", en: "Cart is empty" },
  orderSummary: { uk: "Інформація про замовлення", ru: "Информация о заказе", en: "Order information" },
  subtotal: { uk: "Сума замовлення", ru: "Сумма заказа", en: "Subtotal" },
  discount: { uk: "Знижка", ru: "Скидка", en: "Discount" },
  shippingCost: { uk: "Вартість доставки", ru: "Стоимость доставки", en: "Shipping cost" },
  shippingNote: { uk: "за тарифами оператора", ru: "по тарифам оператора", en: "at carrier rates" },
  alsoBought: { uk: "З цим товаром також купують", ru: "С этим товаром также покупают", en: "Also bought with this product" },
  packs: { uk: "Упаковок", ru: "Упаковок", en: "Packs" },
} satisfies Record<string, LocalizedText>;

export const CHECKOUT_STEP_COPY = {
  step1: { uk: "Особисті дані", ru: "Личные данные", en: "Personal data" },
  step2: { uk: "Доставка", ru: "Доставка", en: "Delivery" },
  step3: { uk: "Оплата", ru: "Оплата", en: "Payment" },
  step4: { uk: "Підтвердження", ru: "Подтверждение", en: "Confirmation" },
  edit: { uk: "Редагувати", ru: "Редактировать", en: "Edit" },
  continue: { uk: "Далі", ru: "Далее", en: "Continue" },
  placeOrder: { uk: "Оформити замовлення", ru: "Оформить заказ", en: "Place order" },
  deliveryMethod: { uk: "Спосіб доставки", ru: "Способ доставки", en: "Delivery method" },
  deliveryAddress: { uk: "Адреса", ru: "Адрес", en: "Address" },
  deliveryPrice: { uk: "Вартість доставки", ru: "Стоимость доставки", en: "Shipping cost" },
  paymentMethod: { uk: "Спосіб оплати", ru: "Способ оплаты", en: "Payment method" },
  recipient: { uk: "Ім'я отримувача", ru: "Имя получателя", en: "Recipient name" },
  codLabel: { uk: "Оплата при отриманні", ru: "Оплата при получении", en: "Cash on delivery" },
  onlineLabel: { uk: "Онлайн-оплата", ru: "Онлайн-оплата", en: "Online payment" },
  branchLabel: { uk: "У відділення Нової пошти", ru: "В отделение Новой почты", en: "Nova Poshta branch" },
  lockerLabel: { uk: "У поштомат Нової пошти", ru: "В почтомат Новой почты", en: "Nova Poshta locker" },
} satisfies Record<string, LocalizedText>;
