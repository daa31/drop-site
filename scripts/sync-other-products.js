const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const L = (uk, ru, en) => ({ uk, ru, en });

function slugify(input) {
  const map = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
    и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
    щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
  };
  return input
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

const products = [
  {
    sku: "TRG-POD4-NKL",
    title: L("Стенд для окулярів, на 4 пари (з нахилом)", "Стенд для очков, на 4 пары (с наклоном)", "Eyewear display stand for 4 pairs, angled"),
    price: 300,
    image: "https://uabest.com.ua/content/images/9/960x1280l80mc0/stend-dlia-ochkov-na-4-pary-s-naklonom-82842982065963.jpg",
    height: "24 см",
    places: "4",
  },
  {
    sku: "TRG-POD5-NKL",
    title: L("Стенд для окулярів, на 5 пар (з нахилом)", "Стенд для очков, на 5 пар (с наклоном)", "Eyewear display stand for 5 pairs, angled"),
    price: 350,
    image: "https://uabest.com.ua/content/images/10/721x1151l80mc0/stend-dlia-ochkov-na-5-par-s-naklonom-28290320806772.jpg",
    height: "30 см",
    places: "5",
  },
  {
    sku: "TRG-POD5-RVN",
    title: L("Стенд для окулярів, на 5 пар (без нахилу)", "Стенд для очков, на 5 пар (без наклона)", "Eyewear display stand for 5 pairs, straight"),
    price: 350,
    image: "https://uabest.com.ua/content/images/11/720x1136l80mc0/stend-dlia-ochkov-na-5-par-bez-naklona-62763491430757.jpg",
    height: "30 см",
    places: "5",
  },
  {
    sku: "TRG-POD4-RVN",
    title: L("Стенд для окулярів, на 4 пари (без нахилу)", "Стенд для очков, на 4 пары (без наклона)", "Eyewear display stand for 4 pairs, straight"),
    price: 300,
    image: "https://uabest.com.ua/content/images/10/960x1280l80mc0/42468796774733.jpg",
    height: "24 см",
    places: "4",
  },
];

async function main() {
  const brand = await prisma.brand.upsert({
    where: { slug: "best" },
    update: {},
    create: {
      slug: "best",
      name: "Best",
      description: L("Товари постачальника Best.", "Товары поставщика Best.", "Best supplier products."),
    },
  });

  const other = await prisma.category.upsert({
    where: { slug: "inshi-tovary" },
    update: {
      name: L("Інше", "Другое", "Other"),
      sortOrder: 900,
    },
    create: {
      slug: "inshi-tovary",
      name: L("Інше", "Другое", "Other"),
      sortOrder: 900,
    },
  });

  const retail = await prisma.category.upsert({
    where: { slug: "torhovoe-oborudovanye" },
    update: {
      name: L("Торгове обладнання", "Торговое оборудование", "Retail equipment"),
      sortOrder: 901,
    },
    create: {
      slug: "torhovoe-oborudovanye",
      name: L("Торгове обладнання", "Торговое оборудование", "Retail equipment"),
      sortOrder: 901,
    },
  });

  await prisma.category.upsert({
    where: { slug: "aksessuary-dlia-okhlazhdenyia-y-zashchyta-ot-solntsa" },
    update: {
      name: L(
        "Аксесуари для охолодження та захисту від сонця",
        "Аксессуары для охлаждения и защиты от солнца",
        "Cooling and sun protection accessories",
      ),
      sortOrder: 902,
    },
    create: {
      slug: "aksessuary-dlia-okhlazhdenyia-y-zashchyta-ot-solntsa",
      name: L(
        "Аксесуари для охолодження та захисту від сонця",
        "Аксессуары для охлаждения и защиты от солнца",
        "Cooling and sun protection accessories",
      ),
      sortOrder: 902,
    },
  });

  for (const item of products) {
    const slug = slugify(`best-${item.sku}-${item.title.uk}`);
    const short = L(
      `Прозорий акриловий стенд для розміщення ${item.places} пар окулярів на вітрині. Висота ${item.height}, ширина 18 см, глибина 10 см.`,
      `Прозрачный акриловый стенд для размещения ${item.places} пар очков на витрине. Высота ${item.height}, ширина 18 см, глубина 10 см.`,
      `Clear acrylic display stand for ${item.places} pairs of glasses. Height ${item.height}, width 18 cm, depth 10 cm.`,
    );
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        slug,
        supplierArticle: item.sku,
        brandId: brand.id,
        name: item.title,
        shortDescription: short,
        description: short,
        attributes: {
          material: "прозорий акрил",
          width: "18 см",
          depth: "10 см",
          height: item.height,
          capacity: `${item.places} пари`,
        },
        supplierPrice: item.price,
        retailPrice: item.price,
        oldPrice: null,
        minimumRetailPrice: item.price,
        discountPercent: 0,
        stock: 999,
        stockStatus: "in_stock",
        isActive: true,
        missingFromFeed: false,
        lastImportedAt: new Date(),
        images: {
          deleteMany: {},
          create: [{ url: item.image, alt: item.title.uk, sortOrder: 0 }],
        },
      },
      create: {
        slug,
        sku: item.sku,
        supplierArticle: item.sku,
        brandId: brand.id,
        name: item.title,
        shortDescription: short,
        description: short,
        attributes: {
          material: "прозорий акрил",
          width: "18 см",
          depth: "10 см",
          height: item.height,
          capacity: `${item.places} пари`,
        },
        supplierPrice: item.price,
        retailPrice: item.price,
        oldPrice: null,
        minimumRetailPrice: item.price,
        discountPercent: 0,
        stock: 999,
        stockStatus: "in_stock",
        isActive: true,
        missingFromFeed: false,
        lastImportedAt: new Date(),
        images: {
          create: [{ url: item.image, alt: item.title.uk, sortOrder: 0 }],
        },
      },
    });

    for (const category of [other, retail]) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
        update: {},
        create: { productId: product.id, categoryId: category.id },
      });
    }

    await prisma.priceHistory.create({
      data: {
        productId: product.id,
        oldPrice: product.retailPrice,
        newPrice: item.price,
        source: "uabest-other-products",
      },
    });
  }

  const count = await prisma.product.count({
    where: { isActive: true, categories: { some: { category: { slug: "inshi-tovary" } } } },
  });
  console.log(`Synced ${products.length} retail equipment products. Other products active count: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
