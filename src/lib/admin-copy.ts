import type { Locale, LocalizedText } from "./localization";
import { tr } from "./localization";

export const ADMIN_NAV_COPY = {
  overview: { uk: "Огляд", ru: "Обзор", en: "Overview" },
  orders: { uk: "Замовлення", ru: "Заказы", en: "Orders" },
  customers: { uk: "Клієнти", ru: "Клиенты", en: "Customers" },
  products: { uk: "Товари", ru: "Товары", en: "Products" },
  categories: { uk: "Категорії", ru: "Категории", en: "Categories" },
  brands: { uk: "Бренди", ru: "Бренды", en: "Brands" },
  import: { uk: "Імпорт", ru: "Импорт", en: "Import" },
  prices: { uk: "Ціни", ru: "Цены", en: "Prices" },
  reviews: { uk: "Відгуки", ru: "Отзывы", en: "Reviews" },
  users: { uk: "Акаунти", ru: "Аккаунты", en: "Accounts" },
  banners: { uk: "Банери", ru: "Баннеры", en: "Banners" },
  seo: { uk: "SEO", ru: "SEO", en: "SEO" },
  settings: { uk: "Налаштування", ru: "Настройки", en: "Settings" },
  catalogGroup: { uk: "Каталог", ru: "Каталог", en: "Catalog" },
  siteGroup: { uk: "Сайт", ru: "Сайт", en: "Site" },
  logout: { uk: "Вийти", ru: "Выйти", en: "Sign out" },
  language: { uk: "Мова", ru: "Язык", en: "Language" },
} satisfies Record<string, LocalizedText>;

export const ADMIN_COMMON_COPY = {
  all: { uk: "Усі", ru: "Все", en: "All" },
  view: { uk: "Переглянути", ru: "Просмотреть", en: "View" },
  delete: { uk: "Видалити", ru: "Удалить", en: "Delete" },
  save: { uk: "Зберегти", ru: "Сохранить", en: "Save" },
  backToOrders: { uk: "Назад до замовлень", ru: "Назад к заказам", en: "Back to orders" },
  revenue: { uk: "Виручка", ru: "Выручка", en: "Revenue" },
  profit: { uk: "Прибуток", ru: "Прибыль", en: "Profit" },
  margin: { uk: "Маржа", ru: "Маржа", en: "Margin" },
  date: { uk: "Дата", ru: "Дата", en: "Date" },
  status: { uk: "Статус", ru: "Статус", en: "Status" },
  action: { uk: "Дія", ru: "Действие", en: "Action" },
  order: { uk: "Замовлення", ru: "Заказ", en: "Order" },
  customer: { uk: "Клієнт", ru: "Клиент", en: "Customer" },
  items: { uk: "Склад", ru: "Состав", en: "Items" },
  ttn: { uk: "ТТН", ru: "ТТН", en: "Tracking" },
  pcs: { uk: "шт.", ru: "шт.", en: "pcs" },
  noData: { uk: "Немає даних.", ru: "Нет данных.", en: "No data." },
  actionError: { uk: "Не вдалося виконати дію.", ru: "Не удалось выполнить действие.", en: "Could not complete the action." },
} satisfies Record<string, LocalizedText>;

export const ADMIN_HOME_COPY = {
  title: { uk: "CRM-огляд", ru: "CRM-обзор", en: "CRM overview" },
  subtitle: {
    uk: "Продажі, прибуток і товари, які купують найчастіше.",
    ru: "Продажи, прибыль и товары, которые покупают чаще всего.",
    en: "Sales, profit and products people buy most often.",
  },
  sevenDays: { uk: "7 днів", ru: "7 дней", en: "7 days" },
  thirtyDays: { uk: "30 днів", ru: "30 дней", en: "30 days" },
  ninetyDays: { uk: "90 днів", ru: "90 дней", en: "90 days" },
  allTime: { uk: "Увесь час", ru: "Все время", en: "All time" },
  ordersWord: { uk: "замовлень", ru: "заказов", en: "orders" },
  productsSold: { uk: "товарів продано", ru: "товаров продано", en: "products sold" },
  active: { uk: "У роботі", ru: "В работе", en: "In progress" },
  productsInCatalog: { uk: "товарів у каталозі", ru: "товаров в каталоге", en: "products in catalog" },
  avgOrder: { uk: "Середній чек", ru: "Средний чек", en: "Average order" },
  mostBought: { uk: "Що купують найчастіше", ru: "Что покупают чаще всего", en: "Most bought" },
  sold: { uk: "Продано", ru: "Продано", en: "Sold" },
  orders: { uk: "Замовлення", ru: "Заказы", en: "Orders" },
  noSales: { uk: "За обраний період продажів поки немає.", ru: "За выбранный период продаж пока нет.", en: "No sales in the selected period yet." },
  mostProfitable: { uk: "Найприбутковіші", ru: "Самые прибыльные", en: "Most profitable" },
  orderQueue: { uk: "Черга замовлень", ru: "Очередь заказов", en: "Order queue" },
  bestCustomers: { uk: "Найкращі клієнти", ru: "Лучшие клиенты", en: "Best customers" },
  noPhone: { uk: "без телефону", ru: "без телефона", en: "no phone" },
  customerBase: { uk: "Клієнтська база", ru: "Клиентская база", en: "Customer base" },
  customers: { uk: "Клієнтів", ru: "Клиентов", en: "Customers" },
  products: { uk: "Товарів", ru: "Товаров", en: "Products" },
  openOrders: { uk: "Відкрити замовлення", ru: "Открыть заказы", en: "Open orders" },
  latestOrders: { uk: "Останні замовлення", ru: "Последние заказы", en: "Latest orders" },
  allOrders: { uk: "Усі замовлення", ru: "Все заказы", en: "All orders" },
  noOrders: { uk: "Замовлень поки немає.", ru: "Заказов пока нет.", en: "No orders yet." },
} satisfies Record<string, LocalizedText>;

export const ADMIN_ORDERS_COPY = {
  title: { uk: "Замовлення", ru: "Заказы", en: "Orders" },
  subtitle: {
    uk: "Робоча черга CRM: статус, клієнт, сума і прибуток.",
    ru: "Рабочая очередь CRM: статус, клиент, сумма и прибыль.",
    en: "CRM work queue: status, customer, total and profit.",
  },
  inSelection: { uk: "У вибірці:", ru: "В выборке:", en: "In selection:" },
  noStatusOrders: { uk: "Замовлень із таким статусом немає.", ru: "Заказов с таким статусом нет.", en: "No orders with this status." },
} satisfies Record<string, LocalizedText>;

export const ADMIN_ORDER_DETAIL_COPY = {
  clientDelivery: { uk: "Клієнт і доставка", ru: "Клиент и доставка", en: "Customer and delivery" },
  name: { uk: "Ім'я", ru: "Имя", en: "Name" },
  phone: { uk: "Телефон", ru: "Телефон", en: "Phone" },
  city: { uk: "Місто", ru: "Город", en: "City" },
  warehouse: { uk: "Відділення", ru: "Отделение", en: "Branch" },
  customerComment: { uk: "Коментар клієнта", ru: "Комментарий клиента", en: "Customer comment" },
  finances: { uk: "Фінанси", ru: "Финансы", en: "Finance" },
  total: { uk: "Разом", ru: "Всего", en: "Total" },
  supplierCost: { uk: "Закупівля", ru: "Закупка", en: "Supplier cost" },
  goods: { uk: "Товари", ru: "Товары", en: "Products" },
  sku: { uk: "Артикул", ru: "Артикул", en: "SKU" },
  qty: { uk: "К-сть", ru: "Кол-во", en: "Qty" },
  price: { uk: "Ціна", ru: "Цена", en: "Price" },
  sum: { uk: "Сума", ru: "Сумма", en: "Sum" },
  work: { uk: "Робота із замовленням", ru: "Работа с заказом", en: "Order workflow" },
  managerComment: { uk: "Коментар менеджера", ru: "Комментарий менеджера", en: "Manager comment" },
  history: { uk: "Історія", ru: "История", en: "History" },
  deleteTitle: { uk: "Видалити замовлення?", ru: "Удалить заказ?", en: "Delete order?" },
  deleteText: {
    uk: "Замовлення буде повністю видалено з CRM разом із товарами та історією.",
    ru: "Заказ будет полностью удален из CRM вместе с товарами и историей.",
    en: "The order will be permanently removed from CRM with its items and history.",
  },
  confirmDelete: { uk: "Так, видалити", ru: "Да, удалить", en: "Yes, delete" },
  keep: { uk: "Ні, залишити", ru: "Нет, оставить", en: "No, keep" },
} satisfies Record<string, LocalizedText>;

export const ADMIN_CUSTOMERS_COPY = {
  title: { uk: "Клієнти", ru: "Клиенты", en: "Customers" },
  subtitle: {
    uk: "Хто купує, скільки приносить і з ким варто працювати повторно.",
    ru: "Кто покупает, сколько приносит и с кем стоит работать повторно.",
    en: "Who buys, how much they bring and who is worth re-engaging.",
  },
  contact: { uk: "Контакт", ru: "Контакт", en: "Contact" },
  orders: { uk: "Замовлення", ru: "Заказы", en: "Orders" },
  lastOrder: { uk: "Останнє замовлення", ru: "Последний заказ", en: "Last order" },
  emailMissing: { uk: "email не вказано", ru: "email не указан", en: "email missing" },
  empty: { uk: "Клієнтів поки немає.", ru: "Клиентов пока нет.", en: "No customers yet." },
} satisfies Record<string, LocalizedText>;

export const ADMIN_PRODUCTS_COPY = {
  title: { uk: "Товари", ru: "Товары", en: "Products" },
  subtitle: {
    uk: "Що продається, скільки приносить і де є гроші.",
    ru: "Что продается, сколько приносит и где есть деньги.",
    en: "What sells, how much it brings and where the money is.",
  },
  sold30: { uk: "Продано за 30 днів", ru: "Продано за 30 дней", en: "Sold in 30 days" },
  revenueProducts: { uk: "Виручка по товарах", ru: "Выручка по товарам", en: "Product revenue" },
  profitProducts: { uk: "Прибуток по товарах", ru: "Прибыль по товарам", en: "Product profit" },
  activeProductsPrefix: { uk: "У каталозі", ru: "В каталоге", en: "Catalog has" },
  activeProductsSuffix: {
    uk: "активних товарів. Нижче показані товари з продажами, відсортовані за попитом.",
    ru: "активных товаров. Ниже показаны товары с продажами, отсортированные по спросу.",
    en: "active products. Products with sales are sorted by demand below.",
  },
  brand: { uk: "Бренд", ru: "Бренд", en: "Brand" },
  allTime: { uk: "Усього", ru: "Всего", en: "All time" },
  supplier: { uk: "Закуп", ru: "Закуп", en: "Supplier" },
  retail: { uk: "Роздріб", ru: "Розница", en: "Retail" },
  empty: { uk: "Товарів поки немає.", ru: "Товаров пока нет.", en: "No products yet." },
} satisfies Record<string, LocalizedText>;

export const ADMIN_SETTINGS_COPY = {
  title: { uk: "Налаштування", ru: "Настройки", en: "Settings" },
  saved: { uk: "Налаштування збережено.", ru: "Настройки сохранены.", en: "Settings saved." },
  testSent: { uk: "Тестовий лист надіслано.", ru: "Тестовое письмо отправлено.", en: "Test email sent." },
  testFailed: {
    uk: "Тестовий лист не надіслано. Перевірте SMTP-налаштування.",
    ru: "Тестовое письмо не отправлено. Проверьте SMTP-настройки.",
    en: "Test email was not sent. Check SMTP settings.",
  },
  emailTitle: { uk: "Email-сповіщення про замовлення", ru: "Email-уведомления о заказах", en: "Order email notifications" },
  emailText: {
    uk: "Щоб сайт надсилав реальні листи, потрібен SMTP-доступ поштового сервісу. Заповніть отримувача, host, порт, користувача і пароль.",
    ru: "Чтобы сайт отправлял реальные письма, нужен SMTP-доступ почтового сервиса. Заполните получателя, host, порт, пользователя и пароль.",
    en: "Real email delivery needs SMTP access from a mail provider. Fill recipient, host, port, user and password.",
  },
  gmailHint: {
    uk: "Для Gmail зазвичай потрібен пароль застосунку, а не звичайний пароль акаунта.",
    ru: "Для Gmail обычно нужен пароль приложения, а не обычный пароль аккаунта.",
    en: "Gmail usually requires an app password, not the regular account password.",
  },
  gmailValues: {
    uk: "Для Gmail заповніть так: SMTP host `smtp.gmail.com`, SMTP port `587`, SMTP secure `false`, SMTP user - ваша Gmail адреса, SMTP password - пароль застосунку Google, SMTP from - наприклад `Locko <ваша@gmail.com>`.",
    ru: "Для Gmail заполните так: SMTP host `smtp.gmail.com`, SMTP port `587`, SMTP secure `false`, SMTP user - ваш Gmail адрес, SMTP password - пароль приложения Google, SMTP from - например `Locko <ваша@gmail.com>`.",
    en: "For Gmail use: SMTP host `smtp.gmail.com`, SMTP port `587`, SMTP secure `false`, SMTP user - your Gmail address, SMTP password - Google app password, SMTP from - for example `Locko <you@gmail.com>`.",
  },
  resendHint: {
    uk: "Resend — надійніший спосіб доставки з власним доменом. Зареєструйтесь на resend.com, створіть API key, підтвердіть домен (додайте DNS-записи) і вкажіть Resend from, як от `Locko <no-reply@ваш-домен>`. Листи підуть через Resend автоматично, якщо заповнений Resend API key.",
    ru: "Resend — более надежный способ доставки со своим доменом. Зарегистрируйтесь на resend.com, создайте API key, подтвердите домен (добавьте DNS-записи) и укажите Resend from, например `Locko <no-reply@ваш-домен>`. Письма пойдут через Resend автоматически, если заполнен Resend API key.",
    en: "Resend is a more reliable delivery option with your own domain. Sign up at resend.com, create an API key, verify your domain (add DNS records) and set Resend from like `Locko <no-reply@your-domain>`. Emails go through Resend automatically when the Resend API key is filled in.",
  },
  other: { uk: "Інші налаштування", ru: "Другие настройки", en: "Other settings" },
  sendTest: { uk: "Надіслати тестовий лист", ru: "Отправить тестовое письмо", en: "Send test email" },
} satisfies Record<string, LocalizedText>;

export function tc(copy: Record<string, LocalizedText>, key: string, locale: Locale) {
  return tr(copy[key], locale);
}
