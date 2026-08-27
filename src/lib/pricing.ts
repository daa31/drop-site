import { prisma } from "./db";
import { roundPrice } from "./utils";

export type PriceResult = {
  supplierPrice: number;
  retailPrice: number;
  oldPrice: number | null;
  discountPercent: number;
  marginPct: number;
  belowMrp: boolean;
  mrp: number | null;
};

export async function getPricingSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["default_margin_pct", "price_rounding", "payment_fee_pct"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    defaultMargin: Number(map.default_margin_pct ?? 25),
    rounding: map.price_rounding ?? "99",
    paymentFeePct: Number(map.payment_fee_pct ?? 0),
  };
}

export function computeRetail(opts: {
  supplierPrice: number;
  defaultMargin: number;
  categoryMargin?: number | null;
  brandMargin?: number | null;
  productMargin?: number | null;
  customRetail?: number | null;
  mrp?: number | null;
  rounding?: string;
  oldPrice?: number | null;
}): PriceResult {
  const {
    supplierPrice,
    defaultMargin,
    categoryMargin,
    brandMargin,
    productMargin,
    customRetail,
    mrp,
    rounding = "99",
    oldPrice,
  } = opts;

  const margin =
    productMargin ?? brandMargin ?? categoryMargin ?? defaultMargin;

  let retail =
    customRetail != null
      ? customRetail
      : supplierPrice * (1 + margin / 100);

  retail = roundPrice(retail, rounding);

  let belowMrp = false;
  if (mrp != null && retail < mrp) {
    retail = mrp;
    belowMrp = customRetail != null ? customRetail < mrp : false;
    if (customRetail == null) belowMrp = true;
  }

  const disc =
    oldPrice && oldPrice > retail
      ? Math.round(((oldPrice - retail) / oldPrice) * 100)
      : 0;

  return {
    supplierPrice,
    retailPrice: retail,
    oldPrice: oldPrice && oldPrice > retail ? oldPrice : null,
    discountPercent: disc,
    marginPct: supplierPrice ? ((retail - supplierPrice) / retail) * 100 : 0,
    belowMrp,
    mrp: mrp ?? null,
  };
}

export function publicProductPrice(p: {
  supplierPrice: number;
  retailPrice: number;
  oldPrice: number | null;
  discountPercent: number;
  stockStatus: string;
  stock: number;
}) {
  return {
    price: p.retailPrice,
    oldPrice: p.oldPrice,
    discountPercent: p.discountPercent,
    inStock: p.stockStatus === "in_stock" && p.stock > 0,
    stockStatus: p.stockStatus,
  };
}
