const NP = "https://api.novaposhta.ua/v2.0/json/";
type WarehouseKind = "all" | "branch" | "locker";

async function callNp(apiKey: string, modelName: string, calledMethod: string, methodProperties: object) {
  const res = await fetch(NP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });
  return res.json();
}

export async function searchCities(apiKey: string, city: string) {
  if (!apiKey) return [];
  const json = await callNp(apiKey, "Address", "getCities", { FindByString: city, Limit: 20 });
  return (json.data || []) as { Description: string; Ref: string; AreaDescription: string }[];
}

function isParcelLocker(item: { Description?: string; DescriptionRu?: string; CategoryOfWarehouse?: string; TypeOfWarehouse?: string }) {
  const text = [item.Description, item.DescriptionRu, item.CategoryOfWarehouse, item.TypeOfWarehouse].filter(Boolean).join(" ").toLowerCase();
  return text.includes("postomat") || text.includes("поштомат") || text.includes("почтомат") || text.includes("parcel locker");
}

export async function searchWarehouses(apiKey: string, cityRef: string, q = "", kind: WarehouseKind = "all") {
  if (!apiKey) return [];
  const json = await callNp(apiKey, "Address", "getWarehouses", {
    CityRef: cityRef,
    FindByString: q,
    Limit: 500,
  });
  const rows = (json.data || []) as {
    Description: string;
    DescriptionRu?: string;
    Ref: string;
    CategoryOfWarehouse?: string;
    TypeOfWarehouse?: string;
    Number?: string;
    ShortAddress?: string;
  }[];
  if (kind === "all") return rows.slice(0, 150);
  return rows.filter((item) => (kind === "locker" ? isParcelLocker(item) : !isParcelLocker(item))).slice(0, 150);
}
