const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const sale = await p.product.findMany({
    where: { isActive: true, isSale: true },
    select: { name: true, retailPrice: true, oldPrice: true, discountPercent: true, isSale: true },
    take: 8,
  });
  console.log("IS_SALE:", sale.length);
  sale.forEach((s) => console.log(JSON.stringify(s.name).slice(0, 60), "| retail:", s.retailPrice, "| old:", s.oldPrice, "| disc%:", s.discountPercent));
  const anyOld = await p.product.count({ where: { isActive: true, oldPrice: { not: null } } });
  console.log("PRODUCTS WITH oldPrice:", anyOld);
  await p.$disconnect();
})();
