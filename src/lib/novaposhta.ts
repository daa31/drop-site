const NP = "https://api.novaposhta.ua/v2.0/json/";

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

export async function searchWarehouses(apiKey: string, cityRef: string, q = "") {
  if (!apiKey) return [];
  const json = await callNp(apiKey, "Address", "getWarehouses", {
    CityRef: cityRef,
    FindByString: q,
    Limit: 40,
  });
  return (json.data || []) as { Description: string; Ref: string; CategoryOfWarehouse: string }[];
}
