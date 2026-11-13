const API_URL = "https://fakestoreapi.com/products";
export async function getProducts(signal) {
  const response = await fetch(API_URL, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Catalog response was invalid.");
  return data;
}