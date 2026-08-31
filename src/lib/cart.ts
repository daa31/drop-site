import { cookies } from "next/headers";

const COOKIE = "fortis_cart";

export type CartItem = { productId: string; qty: number };

export async function getCart(): Promise<CartItem[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    const merged = new Map<string, number>();
    for (const item of parsed) {
      if (!item || typeof item.productId !== "string" || !(item.qty > 0)) continue;
      merged.set(item.productId, (merged.get(item.productId) || 0) + item.qty);
    }
    return Array.from(merged, ([productId, qty]) => ({ productId, qty }));
  } catch {
    return [];
  }
}

export async function setCart(items: CartItem[]) {
  (await cookies()).set(COOKIE, JSON.stringify(items), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function addToCart(productId: string, qty = 1) {
  const items = await getCart();
  const found = items.find((i) => i.productId === productId);
  if (found) found.qty += qty;
  else items.push({ productId, qty });
  await setCart(items);
}

export async function updateCartQty(productId: string, qty: number) {
  const items = await getCart();
  const next = items
    .map((i) => (i.productId === productId ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  await setCart(next);
}
