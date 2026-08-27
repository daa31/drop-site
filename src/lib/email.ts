export function orderEmail(kind: string, number: number, locale: string) {
  const titles: Record<string, Record<string, string>> = {
    received: {
      uk: `Ваше замовлення №${number} прийнято`,
      ru: `Ваш заказ №${number} принят`,
      en: `Order #${number} received`,
    },
    shipped: {
      uk: `Замовлення №${number} відправлено`,
      ru: `Заказ №${number} отправлен`,
      en: `Order #${number} shipped`,
    },
    delivered: {
      uk: `Замовлення №${number} отримано`,
      ru: `Заказ №${number} получен`,
      en: `Order #${number} delivered`,
    },
    reset: { uk: "Відновлення пароля", ru: "Восстановление пароля", en: "Password reset" },
  };
  const title = titles[kind]?.[locale] || titles[kind]?.uk || "";
  return `<!doctype html><html><body style="font-family:sans-serif;background:#f4f5f7;padding:24px">
  <div style="max-width:520px;margin:auto;background:#fff;padding:32px;border-radius:16px">
    <div style="letter-spacing:.2em;font-weight:600">FORTIS</div>
    <h1 style="font-size:22px">${title}</h1>
    <p>FORTIS — спеціалізований магазин захисту зору.</p>
  </div></body></html>`;
}
