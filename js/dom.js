export const $ = selector => document.querySelector(selector);
export function productCard(product) {
  const title = esc(product.title); const category = esc(product.category);
  return `<article class="product-card">
    <div class="product-image-wrap"><span class="product-badge">Curated find</span><img class="product-image" src="${esc(product.image)}" alt="${title}" loading="lazy"><button class="quick-add" data-add="${Number(product.id)}" aria-label="Add ${title} to bag">+</button></div>
    <div class="product-meta"><span class="product-category">${category}</span><span class="product-rating">★ ${Number(product.rating?.rate || 0).toFixed(1)} <span> / 5</span></span></div>
    <h3 class="product-title">${title}</h3><div class="product-bottom"><span class="product-price">$ ${Number(product.price).toFixed(2)}</span><span class="product-category">${Number(product.rating?.count || 0)} reviews</span></div>
  </article>`;
}
export function esc(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char])); }