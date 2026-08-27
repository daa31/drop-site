import { siteSettings } from "@/lib/settings";

const FAQ = [
  {
    q: { uk: "Як обрати захисні окуляри?", ru: "Как выбрать защитные очки?", en: "How do I choose safety glasses?" },
    a: {
      uk: "Визначте задачу (робота, авто, тактика, спорт), потім колір лінзи і чи потрібен Anti-Fog або ущільнювач. Скористайтеся підбором на сайті.",
      ru: "Определите задачу, затем цвет линзы и нужен ли Anti-Fog или уплотнитель.",
      en: "Start with the task, then lens colour and whether you need Anti-Fog or a seal.",
    },
  },
  {
    q: { uk: "Чим відрізняються Anti-Fog окуляри?", ru: "Чем отличаются Anti-Fog очки?", en: "What is Anti-Fog?" },
    a: {
      uk: "Anti-Fog — покриття лінзи, яке зменшує запотівання. Наявність вказуємо лише якщо це зазначено в характеристиках моделі.",
      ru: "Anti-Fog — покрытие, которое снижает запотевание. Указываем только если это есть в характеристиках модели.",
      en: "Anti-Fog is a lens coating that reduces fogging. We only list it when the model specifies it.",
    },
  },
  {
    q: { uk: "Що таке фотохромні лінзи?", ru: "Что такое фотохромные линзы?", en: "What are photochromic lenses?" },
    a: {
      uk: "Фотохромна лінза змінює затемнення залежно від освітлення. У каталозі такі моделі зібрані в окремій категорії.",
      ru: "Фотохромная линза меняет затемнение в зависимости от освещения.",
      en: "Photochromic lenses darken or clear with lighting. They have their own category.",
    },
  },
  {
    q: { uk: "Що таке поляризація?", ru: "Что такое поляризация?", en: "What is polarization?" },
    a: {
      uk: "Поляризаційна лінза зменшує відблиски від горизонтальних поверхонь. Показуємо цю властивість лише для відповідних моделей.",
      ru: "Поляризационная линза снижает блики. Указываем только для соответствующих моделей.",
      en: "Polarized lenses reduce glare. We only mark models that specify this.",
    },
  },
  {
    q: { uk: "Чи можна використовувати окуляри для роботи?", ru: "Можно ли использовать очки для работы?", en: "Can I use these glasses at work?" },
    a: {
      uk: "Так, більшість моделей у каталозі призначені саме для захисту очей під час роботи. Обирайте тип за умовами: відкриті, з ущільнювачем, змінні лінзи.",
      ru: "Да, большинство моделей предназначены для защиты глаз на работе.",
      en: "Yes — most models are intended for eye protection at work. Match the construction to your conditions.",
    },
  },
  {
    q: { uk: "Чи є доставка Новою Поштою?", ru: "Есть ли доставка Новой Почтой?", en: "Do you ship with Nova Poshta?" },
    a: {
      uk: "Так. Після підтвердження замовлення відправлення йде Новою Поштою у відділення або поштомат.",
      ru: "Да. После подтверждения отправляем Новой Почтой.",
      en: "Yes. After confirmation we ship via Nova Poshta to a branch or locker.",
    },
  },
  {
    q: { uk: "Як оформити повернення?", ru: "Как оформить возврат?", en: "How do returns work?" },
    a: {
      uk: "Напишіть нам протягом 14 днів. Товар має зберегти товарний вигляд. Деталі — на сторінці доставки.",
      ru: "Напишите нам в течение 14 дней. Товар должен сохранить товарный вид.",
      en: "Contact us within 14 days. The product must be unused and in original condition.",
    },
  },
  {
    q: { uk: "Як перевірити наявність?", ru: "Как проверить наличие?", en: "How do I check stock?" },
    a: {
      uk: "Статус «В наявності» на картці відповідає поточному залишку в системі. Якщо товару немає — можна залишити заявку на повідомлення.",
      ru: "Статус на карточке соответствует текущему остатку.",
      en: "The stock status on the product page matches the current inventory in our system.",
    },
  },
  {
    q: { uk: "Скільки триває доставка?", ru: "Сколько длится доставка?", en: "How long is delivery?" },
    a: {
      uk: "Зазвичай 1–3 робочі дні після підтвердження, залежно від міста та відділення Нової Пошти.",
      ru: "Обычно 1–3 рабочих дня после подтверждения.",
      en: "Typically 1–3 business days after confirmation, depending on the city.",
    },
  },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const settings = await siteSettings();
  void settings;
  return (
    <div className="container-f max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q[locale as "uk"] || f.q.uk,
              acceptedAnswer: { "@type": "Answer", text: f.a[locale as "uk"] || f.a.uk },
            })),
          }),
        }}
      />
      <h1 className="font-display text-3xl">FAQ</h1>
      <div className="mt-8 space-y-4">
        {FAQ.map((f) => (
          <details key={f.q.uk} className="rounded-2xl bg-white p-5 shadow-card">
            <summary className="cursor-pointer font-medium">{f.q[locale as "uk"] || f.q.uk}</summary>
            <p className="mt-3 text-sm text-graphite/80">{f.a[locale as "uk"] || f.a.uk}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
