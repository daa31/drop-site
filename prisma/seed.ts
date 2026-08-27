import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { computeRetail } from "../src/lib/pricing";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

const L = (uk: string, ru: string, en: string) => ({ uk, ru, en });

const IMG = {
  hero: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=80",
  clear: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80",
  sport: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=900&q=80",
  dark: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
  work: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
  glove: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=900&q=80",
  ear: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
  acc: "https://images.unsplash.com/photo-1613909673375-0d7a5c2f2a4c?auto=format&fit=crop&w=900&q=80",
};

type P = {
  sku: string;
  slug: string;
  brand: string;
  cats: string[];
  name: ReturnType<typeof L>;
  short: ReturnType<typeof L>;
  benefits: string[];
  supplier: number;
  old?: number;
  stock: number;
  hit?: boolean;
  neu?: boolean;
  sale?: boolean;
  pop: number;
  img: string;
  attrs: Record<string, string>;
  kit?: ReturnType<typeof L>;
  usage?: ReturnType<typeof L>;
};

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.seoPage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.create({ data: { key, value } });
  }

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "ChangeMe_Admin_123", 12);
  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@fortis.ua",
      passwordHash: hash,
      name: "Admin",
      role: "admin",
    },
  });

  const brands = ["Pyramex", "Global Vision", "Venture Gear", "Browning", "Ducks Unlimited"];
  const brandMap: Record<string, string> = {};
  for (const name of brands) {
    const b = await prisma.brand.create({
      data: {
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        description: L(
          `${name} — бренд захисної оптики в асортименті FORTIS.`,
          `${name} — бренд защитной оптики в ассортименте FORTIS.`,
          `${name} protective eyewear available at FORTIS.`,
        ),
      },
    });
    brandMap[name] = b.id;
  }

  const cats = [
    { slug: "zakhysni-okuliary", uk: "Захисні окуляри", ru: "Защитные очки", en: "Safety glasses" },
    { slug: "okuliary-z-ushchilniuachem", uk: "Окуляри з ущільнювачем", ru: "Очки с уплотнителем", en: "Sealed eyewear" },
    { slug: "zi-zminnymy-linzamy", uk: "Окуляри зі змінними лінзами", ru: "Очки со сменными линзами", en: "Interchangeable lenses" },
    { slug: "fotokhromni-okuliary", uk: "Фотохромні окуляри", ru: "Фотохромные очки", en: "Photochromic glasses" },
    { slug: "poliaryzatsiini-okuliary", uk: "Поляризаційні окуляри", ru: "Поляризационные очки", en: "Polarized glasses" },
    { slug: "okuliary-dlia-vodiiv", uk: "Окуляри для водіїв", ru: "Очки для водителей", en: "Driver glasses" },
    { slug: "dioptrychni-rishennia", uk: "Діоптричні рішення", ru: "Диоптрические решения", en: "Rx-ready solutions" },
    { slug: "taktychni-okuliary", uk: "Тактичні окуляри", ru: "Тактические очки", en: "Tactical glasses" },
    { slug: "zakhyst-slukhu", uk: "Захист слуху", ru: "Защита слуха", en: "Hearing protection" },
    { slug: "rukavytsi", uk: "Рукавиці", ru: "Перчатки", en: "Gloves" },
    { slug: "aksesuary", uk: "Аксесуари", ru: "Аксессуары", en: "Accessories" },
    { slug: "inshi-tovary", uk: "Інші товари", ru: "Другие товары", en: "Other products" },
  ];

  const catMap: Record<string, string> = {};
  for (const [i, c] of cats.entries()) {
    const row = await prisma.category.create({
      data: {
        slug: c.slug,
        name: L(c.uk, c.ru, c.en),
        sortOrder: i,
        seoText: L(
          `${c.uk} у FORTIS — підбір за призначенням, лінзою та посадкою. Доставка Новою Поштою по Україні.`,
          `${c.ru} в FORTIS — подбор по задаче, линзе и посадке. Доставка Новой Почтой по Украине.`,
          `${c.en} at FORTIS — filter by use, lens and fit. Nova Poshta delivery across Ukraine.`,
        ),
        faq: [
          {
            q: L("Як обрати модель?", "Как выбрать модель?", "How do I choose a model?"),
            a: L(
              "Орієнтуйтесь на задачу: робота, водіння, тактика чи спорт. Потім оберіть колір лінзи та наявність Anti-Fog.",
              "Ориентируйтесь на задачу: работа, вождение, тактика или спорт. Затем выберите цвет линзы и наличие Anti-Fog.",
              "Start with the task — work, driving, tactical or sport — then pick lens colour and Anti-Fog if needed.",
            ),
          },
        ],
        filterKeys: JSON.stringify([
          "brand", "price", "lensColor", "frameColor", "antiFog", "polarized", "photochromic", "rxInsert", "interchangeable",
        ]),
      },
    });
    catMap[c.slug] = row.id;
  }

  const products: P[] = [
    {
      sku: "VG-HOWIBK-BZ1",
      slug: "venture-gear-tactical-howitzer-black-bronze",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Захисні окуляри Venture Gear Tactical Howitzer Black (bronze) Anti-Fog", "Защитные очки Venture Gear Tactical Howitzer Black (bronze) Anti-Fog", "Venture Gear Tactical Howitzer Black bronze Anti-Fog"),
      short: L("Тактичні окуляри Howitzer у чорній оправі з бронзовою лінзою та покриттям Anti-Fog.", "Тактические очки Howitzer в чёрной оправе с бронзовой линзой и Anti-Fog.", "Tactical Howitzer glasses in a black frame with a bronze Anti-Fog lens."),
      benefits: ["Anti-Fog", "тактична лінійка Howitzer"],
      supplier: 1790, old: 1990, stock: 12, hit: true, sale: true, pop: 98, img: IMG.dark,
      attrs: { lensColor: "bronze", frameColor: "black", antiFog: "yes", construction: "open", purpose: "tactical" },
    },
    {
      sku: "3ДРОП",
      slug: "venture-gear-drop-zone-anti-fog",
      brand: "Venture Gear",
      cats: ["zi-zminnymy-linzamy", "taktychni-okuliary"],
      name: L("Окуляри захисні зі змінними лінзами Venture Gear Drop Zone Anti-Fog", "Очки защитные со сменными линзами Venture Gear Drop Zone Anti-Fog", "Venture Gear Drop Zone interchangeable Anti-Fog"),
      short: L("Комплект Drop Zone зі змінними лінзами та Anti-Fog.", "Комплект Drop Zone со сменными линзами и Anti-Fog.", "Drop Zone kit with interchangeable Anti-Fog lenses."),
      benefits: ["змінні лінзи", "Anti-Fog"],
      supplier: 2350, stock: 8, hit: true, pop: 90, img: IMG.sport,
      attrs: { interchangeable: "yes", antiFog: "yes", purpose: "tactical" },
    },
    {
      sku: "2ЕВ24-10",
      slug: "pyramex-ever-lite-photochromic-clear",
      brand: "Pyramex",
      cats: ["fotokhromni-okuliary", "zakhysni-okuliary"],
      name: L("Окуляри фотохромні Pyramex Ever-Lite Photochromic (clear)", "Очки фотохромные Pyramex Ever-Lite Photochromic (clear)", "Pyramex Ever-Lite Photochromic clear"),
      short: L("Фотохромна модель Ever-Lite з прозорою лінзою, що затемнюється на світлі.", "Фотохромная модель Ever-Lite с прозрачной линзой.", "Ever-Lite photochromic lens, clear indoor and darker outdoors."),
      benefits: ["фотохром"],
      supplier: 2290, stock: 10, hit: true, pop: 88, img: IMG.clear,
      attrs: { lensColor: "clear", photochromic: "yes", brand: "Pyramex" },
    },
    {
      sku: "3ХОВИ-50",
      slug: "venture-gear-howitzer-tan-bronze",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Окуляри захисні Venture Gear Tactical Howitzer Tan (bronze) Anti-Fog", "Очки защитные Venture Gear Tactical Howitzer Tan (bronze) Anti-Fog", "Venture Gear Howitzer Tan bronze Anti-Fog"),
      short: L("Howitzer у пісочній оправі з коричневою лінзою Anti-Fog.", "Howitzer в песочной оправе с коричневой линзой Anti-Fog.", "Tan-frame Howitzer with bronze Anti-Fog lens."),
      benefits: ["Anti-Fog"],
      supplier: 1990, stock: 9, hit: true, pop: 86, img: IMG.dark,
      attrs: { lensColor: "bronze", frameColor: "tan", antiFog: "yes", purpose: "tactical" },
    },
    {
      sku: "3ХОВИ-10",
      slug: "venture-gear-howitzer-tan-clear",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Окуляри захисні Venture Gear Tactical Howitzer Tan (clear) Anti-Fog", "Очки защитные Venture Gear Tactical Howitzer Tan (clear) Anti-Fog", "Venture Gear Howitzer Tan clear Anti-Fog"),
      short: L("Прозора лінза Anti-Fog у пісочній оправі Howitzer.", "Прозрачная линза Anti-Fog в песочной оправе Howitzer.", "Clear Anti-Fog Howitzer in a tan frame."),
      benefits: ["Anti-Fog", "прозора лінза"],
      supplier: 1990, stock: 11, hit: true, pop: 84, img: IMG.clear,
      attrs: { lensColor: "clear", frameColor: "tan", antiFog: "yes" },
    },
    {
      sku: "3ХОВИ-21",
      slug: "venture-gear-howitzer-tan-forest-gray",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Окуляри захисні Venture Gear Tactical Howitzer Tan (forest gray) Anti-Fog", "Очки защитные Venture Gear Tactical Howitzer Tan (forest gray) Anti-Fog", "Venture Gear Howitzer Tan forest gray Anti-Fog"),
      short: L("Чорно-зелена лінза forest gray у пісочній оправі.", "Чёрно-зелёная линза forest gray в песочной оправе.", "Forest gray lens in a tan Howitzer frame."),
      benefits: ["Anti-Fog"],
      supplier: 1990, stock: 7, hit: true, pop: 82, img: IMG.dark,
      attrs: { lensColor: "forest gray", frameColor: "tan", antiFog: "yes" },
    },
    {
      sku: "2АИФО-10",
      slug: "pyramex-i-force-slim-clear-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem", "zakhysni-okuliary"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force Slim (clear) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force Slim (clear) Anti-Fog", "Pyramex i-Force Slim clear Anti-Fog"),
      short: L("Компактна модель i-Force Slim з ущільнювачем і прозорою лінзою Anti-Fog.", "Компактная модель i-Force Slim с уплотнителем и прозрачной линзой Anti-Fog.", "Compact sealed i-Force Slim with a clear Anti-Fog lens."),
      benefits: ["ущільнювач", "Anti-Fog"],
      supplier: 1390, old: 1490, stock: 20, hit: true, sale: true, pop: 99, img: IMG.clear,
      attrs: { lensColor: "clear", antiFog: "yes", construction: "sealed", model: "i-Force Slim" },
    },
    {
      sku: "2АИФО-20",
      slug: "pyramex-i-force-slim-gray-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force Slim (gray) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force Slim (gray) Anti-Fog", "Pyramex i-Force Slim gray Anti-Fog"),
      short: L("i-Force Slim із сірою лінзою Anti-Fog та ущільнювачем.", "i-Force Slim с серой линзой Anti-Fog и уплотнителем.", "Sealed i-Force Slim with a gray Anti-Fog lens."),
      benefits: ["ущільнювач", "Anti-Fog"],
      supplier: 1390, old: 1490, stock: 14, hit: true, sale: true, pop: 93, img: IMG.dark,
      attrs: { lensColor: "gray", antiFog: "yes", construction: "sealed" },
    },
    {
      sku: "2АИФО-80",
      slug: "pyramex-i-force-slim-indoor-outdoor-mirror",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force Slim (indoor/outdoor mirror) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force Slim (indoor/outdoor mirror) Anti-Fog", "Pyramex i-Force Slim indoor/outdoor mirror Anti-Fog"),
      short: L("Дзеркальна напівтемна лінза indoor/outdoor у моделі Slim.", "Зеркальная полутёмная линза indoor/outdoor в модели Slim.", "Indoor/outdoor mirror lens on the sealed Slim frame."),
      benefits: ["ущільнювач", "Anti-Fog", "дзеркальна лінза"],
      supplier: 1390, old: 1490, stock: 6, hit: true, sale: true, pop: 80, img: IMG.sport,
      attrs: { lensColor: "indoor/outdoor mirror", antiFog: "yes", construction: "sealed" },
    },
    {
      sku: "2АИФО-XL30",
      slug: "pyramex-i-force-xl-amber-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force XL (amber) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force XL (amber) Anti-Fog", "Pyramex i-Force XL amber Anti-Fog"),
      short: L("Розширена посадка i-Force XL із жовтою лінзою Anti-Fog.", "Расширенная посадка i-Force XL с жёлтой линзой Anti-Fog.", "Wider XL fit with an amber Anti-Fog lens."),
      benefits: ["XL", "Anti-Fog", "жовта лінза"],
      supplier: 1390, old: 1490, stock: 9, sale: true, pop: 77, img: IMG.clear,
      attrs: { lensColor: "amber", antiFog: "yes", construction: "sealed", size: "XL" },
    },
    {
      sku: "2АИФО-XL10",
      slug: "pyramex-i-force-xl-clear-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force XL (clear) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force XL (clear) Anti-Fog", "Pyramex i-Force XL clear Anti-Fog"),
      short: L("Прозора лінза Anti-Fog на розширеній оправі XL.", "Прозрачная линза Anti-Fog на расширенной оправе XL.", "Clear Anti-Fog lens on the XL sealed frame."),
      benefits: ["XL", "Anti-Fog"],
      supplier: 1390, old: 1490, stock: 10, sale: true, pop: 76, img: IMG.clear,
      attrs: { lensColor: "clear", antiFog: "yes", size: "XL" },
    },
    {
      sku: "2АИФО-XL20",
      slug: "pyramex-i-force-xl-gray-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force XL (gray) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force XL (gray) Anti-Fog", "Pyramex i-Force XL gray Anti-Fog"),
      short: L("Чорна / сіра лінза на i-Force XL.", "Серая линза на i-Force XL.", "Gray lens on i-Force XL."),
      benefits: ["XL", "Anti-Fog"],
      supplier: 1390, old: 1490, stock: 8, sale: true, pop: 74, img: IMG.dark,
      attrs: { lensColor: "gray", antiFog: "yes", size: "XL" },
    },
    {
      sku: "2АИФО-XL80",
      slug: "pyramex-i-force-xl-indoor-outdoor-mirror",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force XL (indoor/outdoor mirror) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force XL (indoor/outdoor mirror) Anti-Fog", "Pyramex i-Force XL indoor/outdoor mirror"),
      short: L("Дзеркальна напівтемна лінза на оправі XL.", "Зеркальная полутёмная линза на оправе XL.", "Indoor/outdoor mirror on XL."),
      benefits: ["XL", "Anti-Fog"],
      supplier: 1390, old: 1490, stock: 5, sale: true, pop: 70, img: IMG.sport,
      attrs: { lensColor: "indoor/outdoor mirror", antiFog: "yes", size: "XL" },
    },
    {
      sku: "2АИФО-30",
      slug: "pyramex-i-force-slim-amber-antifog",
      brand: "Pyramex",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Pyramex i-Force Slim (amber) Anti-Fog", "Очки защитные с уплотнителем Pyramex i-Force Slim (amber) Anti-Fog", "Pyramex i-Force Slim amber Anti-Fog"),
      short: L("Жовта лінза amber на компактній Slim.", "Жёлтая линза amber на компактной Slim.", "Amber lens on compact Slim."),
      benefits: ["Anti-Fog", "жовта лінза"],
      supplier: 1290, old: 1490, stock: 13, hit: true, sale: true, pop: 91, img: IMG.clear,
      attrs: { lensColor: "amber", antiFog: "yes" },
    },
    {
      sku: "3СЕМТ-21",
      slug: "venture-gear-semtex-2-tan-forest-gray",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Окуляри захисні Venture Gear Tactical Semtex 2.0 Tan (forest gray) Anti-Fog", "Очки защитные Venture Gear Tactical Semtex 2.0 Tan (forest gray) Anti-Fog", "Venture Gear Semtex 2.0 Tan forest gray"),
      short: L("Semtex 2.0 у пісочній оправі з лінзою forest gray.", "Semtex 2.0 в песочной оправе с линзой forest gray.", "Semtex 2.0 tan frame, forest gray lens."),
      benefits: ["Anti-Fog"],
      supplier: 1990, stock: 6, hit: true, pop: 73, img: IMG.dark,
      attrs: { lensColor: "forest gray", frameColor: "tan", antiFog: "yes" },
    },
    {
      sku: "VG-SEMTAN-CL1",
      slug: "venture-gear-semtex-2-tan-clear",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Захисні окуляри Venture Gear Tactical Semtex 2.0 Tan (clear) Anti-Fog", "Защитные очки Venture Gear Tactical Semtex 2.0 Tan (clear) Anti-Fog", "Venture Gear Semtex 2.0 Tan clear"),
      short: L("Прозора лінза Anti-Fog на Semtex 2.0 Tan.", "Прозрачная линза Anti-Fog на Semtex 2.0 Tan.", "Clear Anti-Fog Semtex 2.0 Tan."),
      benefits: ["Anti-Fog"],
      supplier: 1990, stock: 7, hit: true, pop: 72, img: IMG.clear,
      attrs: { lensColor: "clear", frameColor: "tan", antiFog: "yes" },
    },
    {
      sku: "VG-DRONGN-CL1",
      slug: "venture-gear-drone-2-green-clear",
      brand: "Venture Gear",
      cats: ["zakhysni-okuliary", "taktychni-okuliary"],
      name: L("Захисні окуляри Venture Gear Tactical Drone 2.0 Green (clear) Anti-Fog", "Защитные очки Venture Gear Tactical Drone 2.0 Green (clear) Anti-Fog", "Venture Gear Drone 2.0 Green clear"),
      short: L("Drone 2.0 у зеленій оправі з прозорою лінзою.", "Drone 2.0 в зелёной оправе с прозрачной линзой.", "Green-frame Drone 2.0 with a clear lens."),
      benefits: ["Anti-Fog"],
      supplier: 1990, stock: 4, hit: true, sale: true, pop: 68, img: IMG.clear,
      attrs: { lensColor: "clear", frameColor: "green", antiFog: "yes" },
    },
    {
      sku: "VG-DRONGN-GR1",
      slug: "venture-gear-drone-2-green-gray",
      brand: "Venture Gear",
      cats: ["taktychni-okuliary"],
      name: L("Захисні окуляри Venture Gear Tactical Drone 2.0 Green (gray) Anti-Fog", "Защитные очки Venture Gear Tactical Drone 2.0 Green (gray) Anti-Fog", "Venture Gear Drone 2.0 Green gray"),
      short: L("Сіра лінза на зеленій оправі Drone 2.0.", "Серая линза на зелёной оправе Drone 2.0.", "Gray lens, green Drone 2.0 frame."),
      benefits: ["Anti-Fog"],
      supplier: 1690, old: 1990, stock: 5, sale: true, pop: 71, img: IMG.dark,
      attrs: { lensColor: "gray", frameColor: "green", antiFog: "yes" },
    },
    {
      sku: "VG-DRONBK-GR1",
      slug: "venture-gear-drone-2-black-gray",
      brand: "Venture Gear",
      cats: ["taktychni-okuliary"],
      name: L("Захисні окуляри Venture Gear Tactical Drone 2.0 Black (gray) Anti-Fog", "Защитные очки Venture Gear Tactical Drone 2.0 Black (gray) Anti-Fog", "Venture Gear Drone 2.0 Black gray"),
      short: L("Сіра лінза в чорній оправі Drone 2.0.", "Серая линза в чёрной оправе Drone 2.0.", "Gray lens in a black Drone 2.0 frame."),
      benefits: ["Anti-Fog"],
      supplier: 1690, old: 1990, stock: 6, sale: true, pop: 69, img: IMG.dark,
      attrs: { lensColor: "gray", frameColor: "black", antiFog: "yes" },
    },
    {
      sku: "1БАЛ1-10",
      slug: "global-vision-ballistech-1-clear-antifog",
      brand: "Global Vision",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Global Vision Ballistech-1 (clear) Anti-Fog", "Очки защитные с уплотнителем Global Vision Ballistech-1 (clear) Anti-Fog", "Global Vision Ballistech-1 clear Anti-Fog"),
      short: L("Ballistech-1 з ущільнювачем і прозорою лінзою Anti-Fog.", "Ballistech-1 с уплотнителем и прозрачной линзой Anti-Fog.", "Sealed Ballistech-1 with a clear Anti-Fog lens."),
      benefits: ["ущільнювач", "Anti-Fog"],
      supplier: 1100, stock: 15, hit: true, pop: 85, img: IMG.clear,
      attrs: { lensColor: "clear", antiFog: "yes", construction: "sealed" },
    },
    {
      sku: "1БАЛ1-20",
      slug: "global-vision-ballistech-1-smoke-antifog",
      brand: "Global Vision",
      cats: ["okuliary-z-ushchilniuachem"],
      name: L("Окуляри захисні з ущільнювачем Global Vision Ballistech-1 (smoke) Anti-Fog", "Очки защитные с уплотнителем Global Vision Ballistech-1 (smoke) Anti-Fog", "Global Vision Ballistech-1 smoke Anti-Fog"),
      short: L("Чорна (smoke) лінза Anti-Fog на Ballistech-1.", "Чёрная (smoke) линза Anti-Fog на Ballistech-1.", "Smoke Anti-Fog lens on Ballistech-1."),
      benefits: ["ущільнювач", "Anti-Fog"],
      supplier: 950, stock: 12, hit: true, sale: true, pop: 87, img: IMG.dark,
      attrs: { lensColor: "smoke", antiFog: "yes" },
    },
    {
      sku: "2РАНД-30",
      slug: "pyramex-rendezvous-amber",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Окуляри захисні Pyramex Rendezvous (amber)", "Очки защитные Pyramex Rendezvous (amber)", "Pyramex Rendezvous amber"),
      short: L("Відкриті захисні окуляри Rendezvous із жовтою лінзою.", "Открытые защитные очки Rendezvous с жёлтой линзой.", "Open Rendezvous glasses with an amber lens."),
      benefits: ["жовта лінза"],
      supplier: 490, stock: 22, pop: 60, img: IMG.clear,
      attrs: { lensColor: "amber", construction: "open" },
    },
    {
      sku: "2РАНД-20",
      slug: "pyramex-rendezvous-gray",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Окуляри захисні Pyramex Rendezvous (gray)", "Очки защитные Pyramex Rendezvous (gray)", "Pyramex Rendezvous gray"),
      short: L("Rendezvous із сірою лінзою.", "Rendezvous с серой линзой.", "Rendezvous with a gray lens."),
      benefits: [],
      supplier: 490, stock: 18, pop: 58, img: IMG.dark,
      attrs: { lensColor: "gray", construction: "open" },
    },
    {
      sku: "PM-REND-CL1",
      slug: "pyramex-rendezvous-clear-antifog",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Окуляри захисні Pyramex Rendezvous (clear) Anti-Fog", "Очки защитные Pyramex Rendezvous (clear) Anti-Fog", "Pyramex Rendezvous clear Anti-Fog"),
      short: L("Прозора лінза Anti-Fog на класичній Rendezvous.", "Прозрачная линза Anti-Fog на классической Rendezvous.", "Clear Anti-Fog Rendezvous."),
      benefits: ["Anti-Fog"],
      supplier: 590, stock: 16, pop: 64, img: IMG.clear,
      attrs: { lensColor: "clear", antiFog: "yes" },
    },
    {
      sku: "1ШОРТ24-10",
      slug: "global-vision-shorty-photochromic-clear",
      brand: "Global Vision",
      cats: ["fotokhromni-okuliary"],
      name: L("Окуляри фотохромні Global Vision Shorty Photochromic (clear) Anti-Fog", "Очки фотохромные Global Vision Shorty Photochromic (clear) Anti-Fog", "Global Vision Shorty Photochromic clear"),
      short: L("Фотохромна Shorty з прозорою лінзою та Anti-Fog.", "Фотохромная Shorty с прозрачной линзой и Anti-Fog.", "Photochromic Shorty, clear with Anti-Fog."),
      benefits: ["фотохром", "Anti-Fog"],
      supplier: 2950, stock: 5, hit: true, neu: true, pop: 81, img: IMG.sport,
      attrs: { lensColor: "clear", photochromic: "yes", antiFog: "yes" },
    },
    {
      sku: "1ШОРТ24-30",
      slug: "global-vision-shorty-photochromic-yellow",
      brand: "Global Vision",
      cats: ["fotokhromni-okuliary"],
      name: L("Окуляри фотохромні Global Vision Shorty Photochromic (yellow) Anti-Fog", "Очки фотохромные Global Vision Shorty Photochromic (yellow) Anti-Fog", "Global Vision Shorty Photochromic yellow"),
      short: L("Фотохромна жовта лінза Shorty з Anti-Fog.", "Фотохромная жёлтая линза Shorty с Anti-Fog.", "Yellow photochromic Shorty with Anti-Fog."),
      benefits: ["фотохром", "Anti-Fog"],
      supplier: 2950, stock: 4, hit: true, pop: 79, img: IMG.clear,
      attrs: { lensColor: "yellow", photochromic: "yes", antiFog: "yes" },
    },
    {
      sku: "PM-VENT3-CL1",
      slug: "pyramex-venture-3-clear-antifog",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Захисні окуляри Pyramex Venture-3 (clear) Anti-Fog", "Защитные очки Pyramex Venture-3 (clear) Anti-Fog", "Pyramex Venture-3 clear Anti-Fog"),
      short: L("Venture-3 з прозорою лінзою Anti-Fog.", "Venture-3 с прозрачной линзой Anti-Fog.", "Venture-3 clear Anti-Fog."),
      benefits: ["Anti-Fog"],
      supplier: 590, stock: 20, hit: true, pop: 66, img: IMG.clear,
      attrs: { lensColor: "clear", antiFog: "yes" },
    },
    {
      sku: "PM-VENT3-GR1",
      slug: "pyramex-venture-3-gray-antifog",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Захисні окуляри Pyramex Venture-3 (gray) Anti-Fog", "Защитные очки Pyramex Venture-3 (gray) Anti-Fog", "Pyramex Venture-3 gray Anti-Fog"),
      short: L("Venture-3 із сірою лінзою Anti-Fog.", "Venture-3 с серой линзой Anti-Fog.", "Venture-3 gray Anti-Fog."),
      benefits: ["Anti-Fog"],
      supplier: 590, stock: 17, hit: true, pop: 65, img: IMG.dark,
      attrs: { lensColor: "gray", antiFog: "yes" },
    },
    {
      sku: "PM-LEGA-GR1",
      slug: "pyramex-legacy-gray-h2max",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Захисні окуляри Pyramex Legacy (gray) Super Anti-Fog H2MAX", "Защитные очки Pyramex Legacy (gray) Super Anti-Fog H2MAX", "Pyramex Legacy gray Super Anti-Fog H2MAX"),
      short: L("Legacy із сірою лінзою та покриттям Super Anti-Fog H2MAX.", "Legacy с серой линзой и Super Anti-Fog H2MAX.", "Legacy gray with Super Anti-Fog H2MAX."),
      benefits: ["Super Anti-Fog H2MAX"],
      supplier: 320, old: 350, stock: 25, hit: true, sale: true, pop: 75, img: IMG.dark,
      attrs: { lensColor: "gray", antiFog: "H2MAX" },
    },
    {
      sku: "PM-LEGA-GR",
      slug: "pyramex-legacy-gray",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Захисні окуляри Pyramex Legacy (gray)", "Защитные очки Pyramex Legacy (gray)", "Pyramex Legacy gray"),
      short: L("Базова модель Legacy із сірою лінзою.", "Базовая модель Legacy с серой линзой.", "Base Legacy model with a gray lens."),
      benefits: [],
      supplier: 250, old: 350, stock: 30, sale: true, pop: 62, img: IMG.dark,
      attrs: { lensColor: "gray" },
    },
    {
      sku: "GV-ASTRW-SM",
      slug: "global-vision-astro-white-gtech-silver",
      brand: "Global Vision",
      cats: ["zakhysni-okuliary", "dioptrychni-rishennia"],
      name: L("Окуляри захисні Global Vision Astro White (G-Tech silver)", "Очки защитные Global Vision Astro White (G-Tech silver)", "Global Vision Astro White G-Tech silver"),
      short: L("Біла оправа Astro, дзеркальна сіра лінза G-Tech. Є можливість установки діоптричної вставки.", "Белая оправа Astro, зеркальная серая линза G-Tech. Возможна диоптрическая вставка.", "White Astro frame, G-Tech silver lens. Rx insert compatible."),
      benefits: ["діоптрична вставка", "G-Tech"],
      supplier: 1950, stock: 6, hit: true, pop: 78, img: IMG.sport,
      attrs: { lensColor: "silver mirror", frameColor: "white", rxInsert: "yes" },
    },
    {
      sku: "GV-ASTRBL-GTB",
      slug: "global-vision-astro-blue-gtech-blue",
      brand: "Global Vision",
      cats: ["dioptrychni-rishennia"],
      name: L("Окуляри захисні Global Vision Astro Blue (G-Tech blue)", "Очки защитные Global Vision Astro Blue (G-Tech blue)", "Global Vision Astro Blue G-Tech blue"),
      short: L("Синя оправа Astro з дзеркальною синьою лінзою. Діоптрична вставка.", "Синяя оправа Astro с зеркальной синей линзой. Диоптрическая вставка.", "Blue Astro frame, blue G-Tech lens, Rx insert."),
      benefits: ["діоптрична вставка"],
      supplier: 1950, stock: 5, hit: true, pop: 70, img: IMG.sport,
      attrs: { lensColor: "blue mirror", frameColor: "blue", rxInsert: "yes" },
    },
    {
      sku: "GV-ASTRCM-GR",
      slug: "global-vision-astro-camo-gray",
      brand: "Global Vision",
      cats: ["dioptrychni-rishennia", "taktychni-okuliary"],
      name: L("Окуляри захисні Global Vision Astro Camo (gray)", "Очки защитные Global Vision Astro Camo (gray)", "Global Vision Astro Camo gray"),
      short: L("Камуфльована оправа Astro, сіра лінза, діоптрична вставка.", "Камуфлированная оправа Astro, серая линза, диоптрическая вставка.", "Camo Astro frame, gray lens, Rx insert."),
      benefits: ["діоптрична вставка"],
      supplier: 1850, stock: 4, hit: true, pop: 67, img: IMG.work,
      attrs: { lensColor: "gray", frameColor: "camo", rxInsert: "yes" },
    },
    {
      sku: "PM-SPEC-GTB1",
      slug: "pyramex-pmxspec-blue-mirror-antifog",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Окуляри захисні Pyramex PMXSPEC (blue mirror) Anti-Fog", "Очки защитные Pyramex PMXSPEC (blue mirror) Anti-Fog", "Pyramex PMXSPEC blue mirror Anti-Fog"),
      short: L("Сині дзеркальні лінзи Anti-Fog у чорно-синій оправі PMXSPEC.", "Синие зеркальные линзы Anti-Fog в чёрно-синей оправе PMXSPEC.", "Blue mirror Anti-Fog PMXSPEC."),
      benefits: ["Anti-Fog", "дзеркальна лінза"],
      supplier: 1350, stock: 7, hit: true, pop: 63, img: IMG.sport,
      attrs: { lensColor: "blue mirror", frameColor: "black-blue", antiFog: "yes" },
    },
    {
      sku: "PM-SPEC-GTR1",
      slug: "pyramex-pmxspec-spectrum-antifog",
      brand: "Pyramex",
      cats: ["zakhysni-okuliary"],
      name: L("Окуляри захисні Pyramex PMXSPEC (spectrum) Anti-Fog", "Очки защитные Pyramex PMXSPEC (spectrum) Anti-Fog", "Pyramex PMXSPEC spectrum Anti-Fog"),
      short: L("Дзеркальні червоні лінзи Anti-Fog у чорній оправі.", "Зеркальные красные линзы Anti-Fog в чёрной оправе.", "Red spectrum mirror Anti-Fog, black frame."),
      benefits: ["Anti-Fog"],
      supplier: 1350, stock: 6, hit: true, pop: 61, img: IMG.dark,
      attrs: { lensColor: "spectrum", frameColor: "black", antiFog: "yes" },
    },
    {
      sku: "PM-XSG-KIT1",
      slug: "pyramex-xsg-kit-antifog",
      brand: "Pyramex",
      cats: ["zi-zminnymy-linzamy"],
      name: L("Окуляри захисні зі змінними лінзами Pyramex XSG Kit Anti-Fog", "Очки защитные со сменными линзами Pyramex XSG Kit Anti-Fog", "Pyramex XSG Kit Anti-Fog"),
      short: L("Набір XSG зі змінними лінзами Anti-Fog.", "Набор XSG со сменными линзами Anti-Fog.", "XSG kit with interchangeable Anti-Fog lenses."),
      benefits: ["змінні лінзи", "Anti-Fog"],
      supplier: 1890, stock: 5, neu: true, pop: 59, img: IMG.work,
      attrs: { interchangeable: "yes", antiFog: "yes" },
    },
    {
      sku: "PM-EAR-DP1001",
      slug: "pyramex-ear-protection-dp1001",
      brand: "Pyramex",
      cats: ["zakhyst-slukhu"],
      name: L("Захист слуху Pyramex DP1001", "Защита слуха Pyramex DP1001", "Pyramex hearing protection DP1001"),
      short: L("Засіб захисту слуху Pyramex, артикул DP1001.", "Средство защиты слуха Pyramex, артикул DP1001.", "Pyramex hearing protection, SKU DP1001."),
      benefits: [],
      supplier: 890, stock: 14, pop: 40, img: IMG.ear,
      attrs: { type: "hearing" },
    },
    {
      sku: "FORTIS-GLOVE-01",
      slug: "zakhysni-rukavytsi-mekhanichni",
      brand: "Pyramex",
      cats: ["rukavytsi"],
      name: L("Захисні рукавиці для механічних робіт", "Защитные перчатки для механических работ", "Mechanical work gloves"),
      short: L("Рукавиці для монтажу та механічних робіт. Уточнюйте розмір при замовленні.", "Перчатки для монтажа и механических работ.", "Gloves for assembly and mechanical work. Confirm size when ordering."),
      benefits: [],
      supplier: 320, stock: 40, pop: 35, img: IMG.glove,
      attrs: { type: "gloves" },
    },
    {
      sku: "FORTIS-CASE-01",
      slug: "futliar-dlia-zakhysnykh-okuliariv",
      brand: "Pyramex",
      cats: ["aksesuary"],
      name: L("Футляр для захисних окулярів", "Футляр для защитных очков", "Protective glasses case"),
      short: L("Жорсткий футляр для зберігання та перевезення окулярів.", "Жёсткий футляр для хранения очков.", "Hard case for storing safety glasses."),
      benefits: [],
      supplier: 180, stock: 50, pop: 45, img: IMG.acc,
      attrs: { type: "case" },
    },
    {
      sku: "FORTIS-STRAP-01",
      slug: "remeshok-dlia-okuliariv",
      brand: "Venture Gear",
      cats: ["aksesuary"],
      name: L("Ремінець для окулярів", "Ремешок для очков", "Eyewear strap"),
      short: L("Ремінець для фіксації окулярів під час роботи чи спорту.", "Ремешок для фиксации очков.", "Strap to keep glasses in place at work or sport."),
      benefits: [],
      supplier: 120, stock: 60, pop: 42, img: IMG.acc,
      attrs: { type: "strap" },
    },
  ];

  for (const p of products) {
    const price = computeRetail({
      supplierPrice: p.supplier,
      defaultMargin: 25,
      mrp: p.supplier,
      oldPrice: p.old ?? null,
    });
    const stockStatus = p.stock > 0 ? "in_stock" : "out_of_stock";
    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        supplierArticle: p.sku,
        brandId: brandMap[p.brand],
        name: p.name,
        shortDescription: p.short,
        benefits: p.benefits,
        description: p.short,
        kit: p.kit ?? L("Окуляри в комплекті постачання виробника.", "Очки в комплекте поставки производителя.", "Glasses as supplied by the manufacturer."),
        usage: p.usage ?? L("Робота, спорт або активний відпочинок — відповідно до типу моделі.", "Работа, спорт или активный отдых — согласно типу модели.", "Work, sport or outdoor use according to the model type."),
        attributes: p.attrs,
        supplierPrice: p.supplier,
        retailPrice: price.retailPrice,
        oldPrice: price.oldPrice,
        minimumRetailPrice: p.supplier,
        discountPercent: price.discountPercent,
        stock: p.stock,
        stockStatus,
        isHit: !!p.hit,
        isNew: !!p.neu,
        isSale: !!p.sale,
        popularity: p.pop,
        images: { create: [{ url: p.img, alt: p.name.uk, sortOrder: 0 }] },
        seo: {
          create: {
            path: `/product/${p.slug}`,
            title: L(`${p.name.uk} | FORTIS`, `${p.name.ru} | FORTIS`, `${p.name.en} | FORTIS`),
            description: p.short,
            h1: p.name,
            ogImage: p.img,
          },
        },
      },
    });
    for (const slug of p.cats) {
      await prisma.productCategory.create({ data: { productId: created.id, categoryId: catMap[slug] } });
    }
    await prisma.priceHistory.create({
      data: { productId: created.id, oldPrice: p.supplier, newPrice: price.retailPrice, source: "seed" },
    });
  }

  await prisma.banner.create({
    data: {
      slot: "home_hero",
      title: L("Професійний захист зору", "Профессиональная защита зрения", "Professional eye protection"),
      subtitle: L(
        "Захисні, спортивні і тактичні окуляри для роботи, спорту та активного відпочинку",
        "Защитные, спортивные и тактические очки для работы, спорта и активного отдыха",
        "Safety, sport and tactical eyewear for work, sport and the outdoors",
      ),
      href: "/catalog",
      image: IMG.hero,
      active: true,
    },
  });

  await prisma.coupon.create({ data: { code: "FORTIS10", type: "percent", value: 10, minOrder: 1000 } });

  console.log("Seeded FORTIS catalog");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
