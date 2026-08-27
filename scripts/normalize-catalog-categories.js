const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const L = (uk, ru, en) => ({ uk, ru, en });

const categories = {
  zakhysni: ["zakhysni-okuliary", L("Захисні окуляри", "Защитные очки", "Safety glasses"), 0],
  sealed: ["okuliary-z-ushchilniuachem", L("Окуляри з ущільнювачем", "Очки с уплотнителем", "Sealed eyewear"), 1],
  interchangeable: ["zi-zminnymy-linzamy", L("Окуляри зі змінними лінзами", "Очки со сменными линзами", "Interchangeable lenses"), 2],
  photo: ["fotokhromni-okuliary", L("Фотохромні окуляри", "Фотохромные очки", "Photochromic glasses"), 3],
  polar: ["poliaryzatsiini-okuliary", L("Поляризаційні окуляри", "Поляризационные очки", "Polarized glasses"), 4],
  driver: ["okuliary-dlia-vodiiv", L("Окуляри для водіїв", "Очки для водителей", "Driver glasses"), 5],
  rx: ["dioptrychni-rishennia", L("Діоптричні окуляри", "Диоптрические очки", "Rx-ready glasses"), 6],
  hearing: ["zakhyst-slukhu", L("Захист слуху", "Защита слуха", "Hearing protection"), 8],
  gloves: ["rukavytsi", L("Рукавиці", "Перчатки", "Gloves"), 9],
  accessories: ["aksesuary", L("Аксесуари для окулярів", "Аксессуары для очков", "Eyewear accessories"), 10],
  care: ["zasoby-dlia-dohliadu-za-okuliaramy", L("Засоби для догляду за окулярами", "Средства для ухода за очками", "Eyewear care"), 11],
  straps: ["rementsi-ta-kriplennia-dlia-okuliariv", L("Ремінці та кріплення для окулярів", "Ремешки и крепления для очков", "Straps and holders"), 12],
  cases: ["futliary-chokhly-ta-mishechky-dlia-okuliariv", L("Футляри, чохли та мішечки для окулярів", "Футляры, чехлы и мешочки для очков", "Cases and pouches"), 13],
  other: ["inshi-tovary", L("Інше", "Другое", "Other"), 900],
};

const duplicateMap = new Map([
  ["ochky-zashchytnye-otkrytye", "zakhysni"],
  ["ochky-zashchytnye-s-uplotnytelem", "sealed"],
  ["ochky-zashchytnye-so-smennymy-lynzamy", "interchangeable"],
  ["ochky-zashchytnye-fotokhromnye", "photo"],
  ["ochky-poliaryzatsyonnye", "polar"],
  ["ochky-poliaryzatsyonnye-zashchytnye-2v1", "polar"],
  ["antyfary", "driver"],
  ["byfokalnye-zashchytnye-ochky", "rx"],
  ["byfokalnye-poliaryzatsyonnye-ochky", "rx"],
  ["byfokalnye-poliaryzatsyonnye-zashchytnye-ochky-3v1", "rx"],
  ["byfokalnye-fotokhromnye-zashchytnye-ochky", "rx"],
  ["sportyvnye-opravy-pod-dyoptryy", "rx"],
  ["dyoptrycheskye-vstavky-dlia-ochkov", "rx"],
  ["poliaryzatsyonnye-nakladky-na-ochky", "rx"],
  ["zashchyta-slukha", "hearing"],
  ["aksessuary-dlia-ochkov", "accessories"],
]);

const attachmentDirs = {
  other: "13ce6160-ec2f-416b-9a0f-4dd775cfa05c",
  hearing: "e8ba9eb6-b37a-4c92-b9cd-31058b91ff2d",
  accessories: "587f0faf-1622-4e59-b6ae-b6a384b0ee37",
  care: "19a49892-02a3-4028-86a0-720f844cfe6c",
  straps: "ad313d76-3efa-474b-b51a-488c19f6c931",
};

function readSkus(kind) {
  const file = `C:/Users/robert/.codex/attachments/${attachmentDirs[kind]}/pasted-text.txt`;
  const text = fs.readFileSync(file, "utf8");
  return [...new Set([...text.matchAll(/Артикул:\s*([^\r\n]+)/g)].map((match) => match[1].trim()))];
}

async function ensureCategory(key) {
  const [slug, name, sortOrder] = categories[key];
  return prisma.category.upsert({
    where: { slug },
    update: { name, sortOrder },
    create: { slug, name, sortOrder },
  });
}

async function linkSku(sku, categoryId) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ sku }, { supplierArticle: sku }] },
    select: { id: true },
  });
  if (!product) return false;
  await prisma.productCategory.upsert({
    where: { productId_categoryId: { productId: product.id, categoryId } },
    update: {},
    create: { productId: product.id, categoryId },
  });
  return true;
}

async function moveCategory(sourceSlug, targetKey) {
  const source = await prisma.category.findUnique({
    where: { slug: sourceSlug },
    include: { products: { select: { productId: true } } },
  });
  if (!source) return 0;
  const target = await ensureCategory(targetKey);
  for (const item of source.products) {
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: item.productId, categoryId: target.id } },
      update: {},
      create: { productId: item.productId, categoryId: target.id },
    });
  }
  await prisma.productCategory.deleteMany({ where: { categoryId: source.id } });
  await prisma.category.delete({ where: { id: source.id } });
  return source.products.length;
}

async function main() {
  const ensured = {};
  for (const key of Object.keys(categories)) ensured[key] = await ensureCategory(key);

  const moved = {};
  for (const [source, target] of duplicateMap) moved[source] = await moveCategory(source, target);

  const linked = {};
  for (const kind of ["other", "hearing", "accessories", "care", "straps"]) {
    linked[kind] = 0;
    for (const sku of readSkus(kind)) {
      if (await linkSku(sku, ensured[kind].id)) linked[kind] += 1;
    }
  }

  const accessoryProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      categories: { some: { categoryId: ensured.accessories.id } },
    },
    select: { id: true, name: true, sku: true },
  });
  linked.cases = 0;
  for (const product of accessoryProducts) {
    const name = JSON.stringify(product.name).toLowerCase();
    if (/(футляр|чохол|чехол|мішоч|мешоч|case|pouch|cordura|конверт)/i.test(name)) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: ensured.cases.id } },
        update: {},
        create: { productId: product.id, categoryId: ensured.cases.id },
      });
      linked.cases += 1;
    }
  }

  const summary = await prisma.category.findMany({
    where: { products: { some: { product: { isActive: true } } } },
    select: { slug: true, name: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  console.log({ moved, linked });
  console.log(summary.map((item) => `${item.slug}: ${item._count.products}`).join("\n"));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
