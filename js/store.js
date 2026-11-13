const KEY = "novacart-capstone-v1";
const initial = { user: null, cart: [], orders: [], favorites: [] };
export function loadStore() {
  try { const saved = JSON.parse(localStorage.getItem(KEY)); return saved && typeof saved === "object" ? { ...initial, ...saved } : { ...initial }; }
  catch { return { ...initial }; }
}
export function saveStore(state) { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (error) { console.warn("Unable to persist store state", error); } }
export function addCart(state, product) {
  const cart = [...state.cart]; const found = cart.find(item => item.id === product.id);
  if (found) found.quantity += 1; else cart.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity: 1 });
  return { ...state, cart };
}
export function removeCart(state, id) { return { ...state, cart: state.cart.filter(item => item.id !== id) }; }
export function cartTotal(state) { return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }
export function cartCount(state) { return state.cart.reduce((sum, item) => sum + item.quantity, 0); }
export function createOrder(state) {
  const order = { id: `NC-${Date.now().toString(36).toUpperCase()}`, date: new Date().toISOString(), items: state.cart.map(item => ({ ...item })), total: cartTotal(state), status: "Confirmed" };
  return { ...state, cart: [], orders: [order, ...state.orders] };
}