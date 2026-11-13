import { getProducts } from "./api.js";
import { $, productCard, esc } from "./dom.js";
import { loadStore, saveStore, addCart, removeCart, cartTotal, cartCount, createOrder } from "./store.js";

let state = loadStore();
let products = [];
let activeCategory = "all";
let activeView = "store";
const currency = amount => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const banner = (message, success = false) => { const el = $("#status-banner"); el.textContent = message; el.className = success ? "status-banner success" : "status-banner"; el.hidden = false; };
const persist = () => { saveStore(state); renderHeader(); };
function renderHeader() {
  $("#cart-count").textContent = cartCount(state);
  $("#user-label").textContent = state.user?.name || "Guest";
  $("#user-avatar").textContent = (state.user?.name || "Guest").charAt(0).toUpperCase();
  $("#auth-action").textContent = state.user ? "Sign out" : "Sign in";
}
function renderCategories() {
  const categories = ["all", ...new Set(products.map(item => item.category))];
  $("#category-tabs").innerHTML = categories.map(category => `<button class="category-tab ${activeCategory === category ? "active" : ""}" data-category="${esc(category)}">${category === "all" ? "All items" : esc(category)}</button>`).join("");
}
function filteredProducts() {
  const query = $("#search-input").value.trim().toLowerCase();
  let result = products.filter(item => (activeCategory === "all" || item.category === activeCategory) && (!query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)));
  const sort = $("#sort-select").value;
  if (sort === "price-low") result.sort((a,b) => a.price-b.price);
  if (sort === "price-high") result.sort((a,b) => b.price-a.price);
  if (sort === "rating") result.sort((a,b) => (b.rating?.rate || 0)-(a.rating?.rate || 0));
  return result;
}
function renderCatalog() {
  const result = filteredProducts();
  $("#product-grid").innerHTML = result.map(productCard).join("");
  $("#catalog-count").textContent = `${result.length} thoughtfully selected ${result.length === 1 ? "find" : "finds"}`;
  $("#empty-state").hidden = result.length !== 0;
  $("#product-grid").hidden = result.length === 0;
  renderCategories();
}
function renderCart() {
  $("#drawer-count").textContent = `(${cartCount(state)})`;
  $("#cart-total").textContent = currency(cartTotal(state));
  $("#cart-items").innerHTML = state.cart.length ? state.cart.map(item => `<div class="cart-item"><img src="${esc(item.image)}" alt=""><div><h4>${esc(item.title)}</h4><p>Qty: ${item.quantity} · ${currency(item.price)}</p><button class="remove-item" data-remove="${item.id}">Remove</button></div><span class="cart-item-price">${currency(item.price*item.quantity)}</span></div>`).join("") : '<div class="cart-empty">Your bag is taking a little breather.</div>';
}
function renderOrders() {
  $("#orders-list").innerHTML = state.orders.map(order => `<article class="order-card"><div><div class="order-id">${esc(order.id)}</div><div class="order-date">${new Date(order.date).toLocaleString()}</div><div class="order-items">${order.items.reduce((n,item)=>n+item.quantity,0)} items · ${order.items.map(item=>esc(item.title)).join(", ")}</div><span class="order-status">${esc(order.status)}</span></div><div class="order-total">${currency(order.total)}</div></article>`).join("");
  $("#orders-empty").hidden = state.orders.length > 0;
}
function openCart() { renderCart(); $("#cart-drawer").classList.add("open"); $("#drawer-backdrop").classList.add("open"); $("#cart-drawer").setAttribute("aria-hidden","false"); }
function closeCart() { $("#cart-drawer").classList.remove("open"); $("#drawer-backdrop").classList.remove("open"); $("#cart-drawer").setAttribute("aria-hidden","true"); }
function openAuth() { $("#auth-backdrop").classList.add("open"); $("#auth-name").focus(); }
function closeAuth() { $("#auth-backdrop").classList.remove("open"); }
function setView(view) {
  activeView = view;
  $("#store-view").hidden = view !== "store";
  $("#orders-view").hidden = view !== "orders";
  document.querySelectorAll("[data-view].nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (view === "orders") renderOrders();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function checkout() {
  if (!state.cart.length) { banner("Your bag is empty. Add a find before checking out."); return; }
  if (!state.user) { closeCart(); openAuth(); return; }
  state = createOrder(state); persist(); renderCart(); renderOrders(); closeCart(); banner("Your order is confirmed. A demo order has been added to your history.", true);
  setView("orders");
}
async function init() {
  $("#year").textContent = new Date().getFullYear();
  renderHeader();
  const controller = new AbortController();
  try {
    products = await getProducts(controller.signal);
    $("#skeleton-grid").hidden = true;
    renderCatalog();
  } catch (error) {
    $("#skeleton-grid").hidden = true;
    banner("We couldn't load the collection. Check your connection and reload the page. " + error.message);
  }
}
$("#product-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-add]"); if (!button) return;
  const product = products.find(item => item.id === Number(button.dataset.add)); if (!product) return;
  state = addCart(state, product); persist(); banner("Added to your bag: " + product.title, true);
});
$("#cart-items").addEventListener("click", event => {
  const button = event.target.closest("[data-remove]"); if (!button) return;
  state = removeCart(state, Number(button.dataset.remove)); persist(); renderCart();
});
$("#category-tabs").addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (!button) return; activeCategory = button.dataset.category; renderCatalog(); });
$("#search-input").addEventListener("input", renderCatalog);
$("#sort-select").addEventListener("change", renderCatalog);
$("#clear-filters").addEventListener("click", () => { $("#search-input").value = ""; $("#sort-select").value = "featured"; activeCategory = "all"; renderCatalog(); });
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#continue-shopping").addEventListener("click", closeCart);
$("#drawer-backdrop").addEventListener("click", closeCart);
$("#checkout-button").addEventListener("click", checkout);
$("#auth-action").addEventListener("click", () => { if (state.user) { state = { ...state, user: null }; persist(); banner("You have signed out.", true); } else openAuth(); });
$("#close-auth").addEventListener("click", closeAuth);
$("#auth-backdrop").addEventListener("click", event => { if (event.target.id === "auth-backdrop") closeAuth(); });
$("#auth-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name")).trim(); const email = String(form.get("email")).trim();
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  state = { ...state, user: { name, email } }; persist(); closeAuth(); banner("Welcome, " + name + ". Your demo session is ready.", true);
  if (state.cart.length) openCart();
});
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCart(); closeAuth(); } });
init();