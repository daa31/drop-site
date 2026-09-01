import nodemailer from "nodemailer";
import type { Order, OrderItem, Customer } from "@prisma/client";
import { formatPrice, publicSiteBase } from "./utils";
import { normalizeLocale } from "./localization";

export type MailResult = {
  status: "sent" | "skipped" | "failed";
  message: string;
};

type OrderWithMailData = Order & {
  customer: Customer | null;
  items: OrderItem[];
};

function setting(settings: Record<string, string>, key: string, envKey?: string) {
  return (settings[key] || (envKey ? process.env[envKey] : "") || "").trim();
}

function boolSetting(value: string) {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function customerFullName(customer: Pick<Customer, "name" | "surname" | "patronymic"> | null | undefined) {
  if (!customer) return "-";
  return [customer.surname, customer.name, customer.patronymic].filter(Boolean).join(" ") || "-";
}

function mailCopy(locale: string) {
  const current = normalizeLocale(locale);
  if (current === "en") {
    return {
      subject: (number: number, total: string) => `New order #${number} for ${total}`,
      title: (number: number) => `New order #${number}`,
      intro: "A new order has been placed on the website.",
      customer: "Customer",
      phone: "Phone",
      email: "Email",
      telegram: "Telegram",
      city: "City",
      warehouse: "Branch",
      payment: "Payment",
      items: "Items",
      total: "Total",
      comment: "Comment",
      admin: "Admin",
      open: "Open order",
      noContact: "Do not contact the customer",
      cod: "Pay on delivery",
      online: "Online payment",
    };
  }
  if (current === "ru") {
    return {
      subject: (number: number, total: string) => `Новый заказ #${number} на ${total}`,
      title: (number: number) => `Новый заказ #${number}`,
      intro: "На сайте оформлен новый заказ.",
      customer: "Клиент",
      phone: "Телефон",
      email: "Email",
      telegram: "Telegram",
      city: "Город",
      warehouse: "Отделение",
      payment: "Оплата",
      items: "Товары",
      total: "Итого",
      comment: "Комментарий",
      admin: "Админка",
      open: "Открыть заказ",
      noContact: "Не связываться с клиентом",
      cod: "Оплата при получении",
      online: "Онлайн-оплата",
    };
  }
  return {
    subject: (number: number, total: string) => `Нове замовлення #${number} на ${total}`,
    title: (number: number) => `Нове замовлення #${number}`,
    intro: "На сайті оформлено нове замовлення.",
    customer: "Клієнт",
    phone: "Телефон",
    email: "Email",
    telegram: "Telegram",
    city: "Місто",
    warehouse: "Відділення",
    payment: "Оплата",
    items: "Товари",
    total: "Разом",
    comment: "Коментар",
    admin: "Адмінка",
    open: "Відкрити замовлення",
    noContact: "Не зв'язуватись з клієнтом",
    cod: "Оплата при отриманні",
    online: "Онлайн-оплата",
  };
}

function paymentMethodLabel(method: string, locale: string) {
  const c = mailCopy(locale);
  if (method === "cod") return c.cod;
  if (method === "online") return c.online;
  return method;
}

function orderLines(order: OrderWithMailData) {
  const locale = normalizeLocale(order.locale);
  return order.items
    .map((item) => `${item.name} x ${item.qty} - ${formatPrice(item.total, locale)}`)
    .join("\n");
}

function orderHtml(order: OrderWithMailData, adminUrl: string, noContact = false, telegram = "") {
  const customer = order.customer;
  const locale = normalizeLocale(order.locale);
  const c = mailCopy(locale);
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.total, locale)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#111214">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border-radius:14px;padding:24px">
        <div style="letter-spacing:.18em;font-weight:700">Locko</div>
        <h1 style="font-size:24px;margin:18px 0 10px">${escapeHtml(c.title(order.number))}</h1>
        <p style="margin:0 0 18px;color:#555">${escapeHtml(c.intro)}</p>
        ${noContact ? `<p style="margin:0 0 18px;color:#dc2626;font-weight:700;font-size:15px">${escapeHtml(c.noContact)}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.customer)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(customerFullName(customer))}</td></tr>
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.phone)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(customer?.phone || "-")}</td></tr>
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.email)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(customer?.email || "-")}</td></tr>
          ${telegram ? `<tr><td style="padding:4px 0;color:#666">${escapeHtml(c.telegram)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(telegram)}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.city)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(order.deliveryCity || "-")}</td></tr>
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.warehouse)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(order.warehouse || "-")}</td></tr>
          <tr><td style="padding:4px 0;color:#666">${escapeHtml(c.payment)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(paymentMethodLabel(order.paymentMethod, locale))}</td></tr>
        </table>
        <h2 style="font-size:16px;margin:22px 0 8px">${escapeHtml(c.items)}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
        <p style="font-size:20px;font-weight:700;margin:22px 0 6px">${escapeHtml(c.total)}: ${formatPrice(order.total, locale)}</p>
        ${order.comment ? `<p style="white-space:pre-wrap;color:#444">${escapeHtml(order.comment)}</p>` : ""}
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;margin-top:16px;background:#111214;color:#fff;text-decoration:none;border-radius:999px;padding:12px 18px">${escapeHtml(c.open)}</a>
      </div>
    </div>
  </body>
</html>`;
}

function customerMailCopy(locale: string) {
  const current = normalizeLocale(locale);
  if (current === "en") {
    return {
      subject: (number: number) => `Order #${number} received — Locko`,
      greeting: (name: string) => `Hello, ${name}!`,
      thanks: "Thank you for your order. We received it and it is now being prepared.",
      manager: "Our manager will contact you soon via Telegram to confirm all the details.",
      deliveryTitle: "Delivery",
      city: "City",
      warehouse: "Warehouse / parcel locker",
      payment: "Payment",
      cod: "Pay on delivery",
      online: "Online payment",
      itemsTitle: "Your order",
      total: "Total",
      track: "Track order",
      trackHint: "The button below opens your order page where you can check the status.",
      footer: "Locko — store of protective eyewear.",
    };
  }
  if (current === "ru") {
    return {
      subject: (number: number) => `Ваш заказ №${number} принят — Locko`,
      greeting: (name: string) => `Здравствуйте, ${name}!`,
      thanks: "Спасибо за ваш заказ. Мы получили его и уже готовим к отправке.",
      manager: "Скоро с вами свяжется менеджер в Telegram, чтобы подтвердить детали заказа.",
      deliveryTitle: "Доставка",
      city: "Город",
      warehouse: "Отделение / почтомат",
      payment: "Оплата",
      cod: "Оплата при получении",
      online: "Онлайн-оплата",
      itemsTitle: "Ваш заказ",
      total: "Итого",
      track: "Посмотреть заказ",
      trackHint: "По кнопке ниже вы перейдёте на страницу заказа в нашем магазине, где сможете следить за его статусом.",
      footer: "Locko — магазин защитных очков.",
    };
  }
  return {
    subject: (number: number) => `Ваше замовлення №${number} прийнято — Locko`,
    greeting: (name: string) => `Вітаємо, ${name}!`,
    thanks: "Дякуємо за ваше замовлення. Ми отримали його та вже готуємо до відправлення.",
    manager: "Скоро з вами зв'яжеться менеджер у Telegram, щоб підтвердити деталі замовлення.",
    deliveryTitle: "Доставка",
    city: "Місто",
    warehouse: "Відділення / поштомат",
    payment: "Оплата",
    cod: "Оплата при отриманні",
    online: "Онлайн-оплата",
    itemsTitle: "Ваше замовлення",
    total: "Разом",
    track: "Переглянути замовлення",
    trackHint: "За кнопкою нижче ви перейдете на сторінку замовлення в нашому магазині, де зможете стежити за його статусом.",
    footer: "Locko — магазин захисних окулярів.",
  };
}

function deliveryMethodLabel(method: string, locale: string) {
  const c = customerMailCopy(locale);
  if (method === "nova_poshta_locker") {
    return normalizeLocale(locale) === "en" ? "Nova Poshta parcel locker" : normalizeLocale(locale) === "ru" ? "Новая почта, почтомат" : "Нова пошта, поштомат";
  }
  if (method === "nova_poshta_branch" || method === "nova_poshta") {
    return normalizeLocale(locale) === "en" ? "Nova Poshta branch" : normalizeLocale(locale) === "ru" ? "Новая почта, отделение" : "Нова пошта, відділення";
  }
  return method || "Нова пошта";
}

function customerOrderPublicUrl(order: OrderWithMailData, baseUrl: string) {
  const token = order.publicToken;
  if (!token) return "";
  const locale = normalizeLocale(order.locale);
  const localePrefix = locale === "uk" ? "" : `/${locale}`;
  return `${baseUrl}${localePrefix}/order/${token}`;
}

function customerOrderHtml(order: OrderWithMailData, publicUrl: string, noContact = false) {
  const customer = order.customer;
  const locale = normalizeLocale(order.locale);
  const c = customerMailCopy(locale);
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.total, locale)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#111214">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border-radius:14px;padding:24px">
        <div style="letter-spacing:.18em;font-weight:700">Locko</div>
        <h1 style="font-size:22px;margin:18px 0 10px">${escapeHtml(c.greeting(customer?.name || ""))}</h1>
        <p style="margin:0 0 10px;color:#333">${escapeHtml(c.thanks)}</p>
        ${noContact ? "" : `<p style="margin:0 0 18px;color:#333">${escapeHtml(c.manager)}</p>`}
        <h2 style="font-size:16px;margin:0 0 8px">${escapeHtml(c.itemsTitle)} №${order.number}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
        <p style="font-size:20px;font-weight:700;margin:22px 0 6px">${escapeHtml(c.total)}: ${formatPrice(order.total, locale)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:18px;background:#fafafa;border-radius:10px">
          <tr><td style="padding:10px;color:#666">${escapeHtml(c.deliveryTitle)}</td><td style="padding:10px;text-align:right">${escapeHtml(deliveryMethodLabel(order.deliveryMethod, locale))}</td></tr>
          <tr><td style="padding:10px;color:#666">${escapeHtml(c.city)}</td><td style="padding:10px;text-align:right">${escapeHtml(order.deliveryCity || "-")}</td></tr>
          <tr><td style="padding:10px;color:#666">${escapeHtml(c.warehouse)}</td><td style="padding:10px;text-align:right">${escapeHtml(order.warehouse || "-")}</td></tr>
          <tr><td style="padding:10px;color:#666">${escapeHtml(c.payment)}</td><td style="padding:10px;text-align:right">${escapeHtml(order.paymentMethod === "online" ? c.online : c.cod)}</td></tr>
        </table>
        <p style="margin:22px 0 8px;color:#555">${escapeHtml(c.trackHint)}</p>
        ${publicUrl ? `<a href="${escapeHtml(publicUrl)}" style="display:inline-block;background:#111214;color:#fff;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:700">${escapeHtml(c.track)}</a>` : ""}
      </div>
      <p style="text-align:center;color:#888;font-size:12px;margin-top:18px">${escapeHtml(c.footer)}</p>
    </div>
  </body>
</html>`;
}

type MailMessage = {
  settings: Record<string, string>;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

async function resendSend(payload: {
  apiKey: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${payload.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      reply_to: payload.replyTo || undefined,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  const message = Array.isArray(data?.message)
    ? (data.message as string[]).join(", ")
    : typeof data?.message === "string"
      ? data.message
      : `Resend error ${res.status}`;
  if (!res.ok) return { ok: false, message } as const;
  return { ok: true, message: data?.id ? `Resend ${data.id}` : "Resend sent." } as const;
}

async function sendViaSmtp(payload: MailMessage): Promise<MailResult> {
  const { settings } = payload;
  const host = setting(settings, "smtp_host", "SMTP_HOST");
  const port = Number(setting(settings, "smtp_port", "SMTP_PORT") || 587);
  const user = setting(settings, "smtp_user", "SMTP_USER");
  const pass = setting(settings, "smtp_pass", "SMTP_PASSWORD");
  const secureSetting = setting(settings, "smtp_secure", "SMTP_SECURE");
  if (!host) return { status: "skipped", message: "SMTP host is not configured." };
  if (!Number.isFinite(port) || port < 1) return { status: "failed", message: "SMTP port is invalid." };
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secureSetting ? boolSetting(secureSetting) : port === 465,
      auth: user || pass ? { user, pass } : undefined,
    });
    await transporter.sendMail({
      from: payload.from,
      to: payload.to,
      replyTo: payload.replyTo || undefined,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return { status: "sent", message: `Sent to ${payload.to}.` };
  } catch (error) {
    return { status: "failed", message: error instanceof Error ? error.message : "Email sending failed." };
  }
}

export async function sendMail(payload: MailMessage): Promise<MailResult> {
  const apiKey = setting(payload.settings, "resend_api_key", "RESEND_API_KEY");
  const resendFrom = setting(payload.settings, "resend_from", "RESEND_FROM");
  if (apiKey && resendFrom) {
    try {
      const result = await resendSend({
        apiKey,
        from: resendFrom,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      return result.ok
        ? { status: "sent", message: `Sent to ${payload.to}.` }
        : { status: "failed", message: result.message };
    } catch (error) {
      return { status: "failed", message: error instanceof Error ? error.message : "Resend email failed." };
    }
  }
  return sendViaSmtp(payload);
}

export async function sendOrderCustomerEmail({
  settings,
  order,
  noContact = false,
}: {
  settings: Record<string, string>;
  order: OrderWithMailData;
  noContact?: boolean;
}): Promise<MailResult> {
  const to = order.customer?.email?.trim();
  if (!to) return { status: "skipped", message: "No customer email." };

  const user = setting(settings, "smtp_user", "SMTP_USER");
  const from = setting(settings, "smtp_from", "SMTP_FROM") || (user ? `Locko <${user}>` : `Locko <${setting(settings, "smtp_host", "SMTP_HOST")}>`);

  const locale = normalizeLocale(order.locale);
  const c = customerMailCopy(locale);
  const subject = c.subject(order.number);
  const publicUrl = customerOrderPublicUrl(order, publicSiteBase(settings));
  const text = [
    c.subject(order.number),
    "",
    c.greeting(order.customer?.name || ""),
    c.thanks,
    noContact ? "" : c.manager,
    "",
    `${c.itemsTitle} №${order.number}`,
    orderLines(order),
    "",
    `${c.total}: ${formatPrice(order.total, locale)}`,
    `${c.deliveryTitle}: ${deliveryMethodLabel(order.deliveryMethod, locale)}`,
    `${c.city}: ${order.deliveryCity || "-"}`,
    `${c.warehouse}: ${order.warehouse || "-"}`,
    publicUrl ? `${c.track}: ${publicUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return sendMail({ settings, from, to, subject, text, html: customerOrderHtml(order, publicUrl, noContact) });
}

export async function sendOrderNotificationEmail({
  settings,
  order,
  adminUrl,
  noContact = false,
  telegram = "",
}: {
  settings: Record<string, string>;
  order: OrderWithMailData;
  adminUrl: string;
  noContact?: boolean;
  telegram?: string;
}): Promise<MailResult> {
  const to =
    setting(settings, "order_notification_email", "ORDER_NOTIFICATION_EMAIL") ||
    setting(settings, "email", "ADMIN_EMAIL");
  if (!to) return { status: "skipped", message: "Recipient email is not configured." };

  const user = setting(settings, "smtp_user", "SMTP_USER");
  const from = setting(settings, "smtp_from", "SMTP_FROM") || (user ? `Locko <${user}>` : `Locko <${to}>`);

  const customer = order.customer;
  const locale = normalizeLocale(order.locale);
  const c = mailCopy(locale);
  const subject = c.subject(order.number, formatPrice(order.total, locale));
  const text = [
    subject,
    "",
    noContact ? c.noContact.toUpperCase() : "",
    `${c.customer}: ${customerFullName(customer)}`,
    `${c.phone}: ${customer?.phone || "-"}`,
    `${c.email}: ${customer?.email || "-"}`,
    telegram ? `${c.telegram}: ${telegram}` : "",
    `${c.city}: ${order.deliveryCity || "-"}`,
    `${c.warehouse}: ${order.warehouse || "-"}`,
    `${c.payment}: ${paymentMethodLabel(order.paymentMethod, locale)}`,
    "",
    orderLines(order),
    "",
    `${c.total}: ${formatPrice(order.total, locale)}`,
    order.comment ? `${c.comment}: ${order.comment}` : "",
    `${c.admin}: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendMail({ settings, from, to, subject, text, html: orderHtml(order, adminUrl, noContact, telegram) });
}

function cancelAdminCopy(locale: string) {
  const current = normalizeLocale(locale);
  if (current === "en") {
    return {
      subject: (number: number) => `Order #${number} cancelled by customer`,
      intro: "The customer has cancelled this order. Please do not ship it.",
      customer: "Customer",
      phone: "Phone",
      email: "Email",
      city: "City",
      warehouse: "Branch",
      items: "Items",
      open: "Open order",
    };
  }
  if (current === "ru") {
    return {
      subject: (number: number) => `Заказ #${number} отменён клиентом`,
      intro: "Клиент отменил этот заказ. Пожалуйста, не отправляйте его.",
      customer: "Клиент",
      phone: "Телефон",
      email: "Email",
      city: "Город",
      warehouse: "Отделение",
      items: "Товары",
      open: "Открыть заказ",
    };
  }
  return {
    subject: (number: number) => `Замовлення №${number} скасоване клієнтом`,
    intro: "Клієнт скасував це замовлення. Будь ласка, не відправляйте його.",
    customer: "Клієнт",
    phone: "Телефон",
    email: "Email",
    city: "Місто",
    warehouse: "Відділення",
    items: "Товари",
    open: "Відкрити замовлення",
  };
}

function cancelCustomerCopy(_locale: string) {
  return { subject: () => "", greeting: () => "", intro: "", items: "", total: "", track: "" };
}

function mailFrom(settings: Record<string, string>, fallbackTo: string) {
  const user = setting(settings, "smtp_user", "SMTP_USER");
  return setting(settings, "smtp_from", "SMTP_FROM") || (user ? `Locko <${user}>` : `Locko <${fallbackTo}>`);
}

function cancelMailHtml(title: string, intro: string, lines: string[], _totalLine: string, cta?: { url: string; label: string }) {
  const rows = lines
    .map((line) => {
      const idx = line.indexOf(": ");
      const label = idx > 0 ? line.slice(0, idx) : "";
      const value = idx > 0 ? line.slice(idx + 2) : line;
      return `<tr><td style="padding:4px 0;color:#666">${escapeHtml(label)}</td><td style="padding:4px 0;text-align:right">${escapeHtml(value)}</td></tr>`;
    })
    .join("");
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#111214">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border-radius:14px;padding:24px">
        <div style="letter-spacing:.18em;font-weight:700">Locko</div>
        <h1 style="font-size:22px;margin:18px 0 10px">${escapeHtml(title)}</h1>
        <p style="margin:0 0 18px;color:#555">${escapeHtml(intro)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
        ${cta ? `<a href="${escapeHtml(cta.url)}" style="display:inline-block;margin-top:16px;background:#111214;color:#fff;text-decoration:none;border-radius:999px;padding:12px 18px">${escapeHtml(cta.label)}</a>` : ""}
      </div>
    </div>
  </body>
</html>`;
}

export async function sendOrderCancelledEmails({
  settings,
  order,
  adminUrl,
}: {
  settings: Record<string, string>;
  order: OrderWithMailData;
  adminUrl: string;
}): Promise<{ admin: MailResult; customer: MailResult }> {
  const locale = normalizeLocale(order.locale);
  const customer = order.customer;

  const ac = cancelAdminCopy(locale);
  const adminTo =
    setting(settings, "order_notification_email", "ORDER_NOTIFICATION_EMAIL") || setting(settings, "email", "ADMIN_EMAIL");
  const adminSubject = ac.subject(order.number);
  const adminLines = [
    `${ac.customer}: ${customerFullName(customer)}`,
    `${ac.phone}: ${customer?.phone || "-"}`,
    `${ac.email}: ${customer?.email || "-"}`,
    `${ac.city}: ${order.deliveryCity || "-"}`,
    `${ac.warehouse}: ${order.warehouse || "-"}`,
    "",
    `${ac.items}:`,
    orderLines(order),
  ];
  const admin: MailResult = adminTo
    ? await sendMail({
        settings,
        from: mailFrom(settings, adminTo),
        to: adminTo,
        subject: adminSubject,
        text: [adminSubject, "", ac.intro, "", ...adminLines, "", `${ac.open}: ${adminUrl}`].filter(Boolean).join("\n"),
        html: cancelMailHtml(adminSubject, ac.intro, adminLines, "", { url: adminUrl, label: ac.open }),
      })
    : { status: "skipped", message: "Recipient email is not configured." };

  void cancelCustomerCopy(locale);

  return { admin, customer: { status: "skipped", message: "Customer notifications are disabled." } };
}

export async function sendTestEmail(settings: Record<string, string>): Promise<MailResult> {
  const to =
    setting(settings, "order_notification_email", "ORDER_NOTIFICATION_EMAIL") ||
    setting(settings, "email", "ADMIN_EMAIL");
  if (!to) return { status: "skipped", message: "Recipient email is not configured." };

  const user = setting(settings, "smtp_user", "SMTP_USER");
  const from = setting(settings, "smtp_from", "SMTP_FROM") || (user ? `Locko <${user}>` : `Locko <${to}>`);

  return sendMail({
    settings,
    from,
    to,
    subject: "Тестовое письмо Locko",
    text: "Email уведомления о новых заказах подключены.",
    html: "<p>Email-уведомления о новых заказах подключены.</p>",
  });
}
