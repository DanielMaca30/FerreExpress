// src/utils/cartStore.js

// 🔑 Clave base del carrito (no por usuario aún)
export const CART_KEY = "fe_cart_v1";

/* ---------- helper: clave por usuario/rol ---------- */
function getCartKey() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) {
      // Invitado: todos los no logueados comparten este carrito
      return CART_KEY;
    }

    const user = JSON.parse(raw);
    const role = (user?.role || "CLIENTE").toUpperCase();
    const email = (user?.email || "anon").toLowerCase();

    // Ejemplos:
    // fe_cart_v1_CLIENTE_correo@x.com
    // fe_cart_v1_CONTRATISTA_empresa@y.com
    return `${CART_KEY}_${role}_${email}`;
  } catch {
    // Fallback: carrito invitado
    return CART_KEY;
  }
}

/* ---------- utilidades internas ---------- */
function safeParse(raw) {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function snapshot(cart) {
  let subtotal = 0;
  let units = 0;
  for (const it of cart) {
    const unit = effectiveUnitPrice(it);
    const q = Math.max(1, Number(it.cantidad) || 1);
    units += q;
    subtotal += unit * q;
  }
  return {
    skus: cart.length,   // ítems distintos
    units,               // unidades totales
    subtotal,            // suma COP
  };
}

function emitCartChanged(detail = {}) {
  try {
    const evt = new CustomEvent("cart:changed", { detail });
    window.dispatchEvent(evt);
  } catch {
    // no-op en SSR/entornos sin window
  }
}

function clampQty(q, stock) {
  const min = 1;
  const max = Number.isFinite(stock) && stock > 0 ? Math.max(min, stock) : Infinity;
  const n = Math.max(min, Number(q) || min);
  return Math.min(n, max);
}

/* ---------- API pública ---------- */
export function readCart() {
  try {
    const raw = localStorage.getItem(getCartKey());
    return safeParse(raw);
  } catch {
    return [];
  }
}

export function writeCart(items, meta = {}) {
  const cart = items || [];
  try {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  } catch {
    // almacenamiento lleno o bloqueado; aún emitimos para refrescar UI
  } finally {
    const snap = snapshot(cart);
    emitCartChanged({
      ...snap,
      lastAction: meta.lastAction || "write",
      isNewSku: !!meta.isNewSku,
      addedUnits: meta.addedUnits || 0,
    });
  }
  return cart;
}

export function clearCart() {
  try {
    localStorage.removeItem(getCartKey());
  } catch {
    // ignore
  }
  // emitimos evento de clean
  return writeCart([], { lastAction: "clear" });
}

export function addToCart(product, qty = 1) {
  const cart = readCart();

  const stock = Number(product?.stock);
  const quantity = clampQty(qty, Number.isFinite(stock) ? stock : undefined);

  const idx = cart.findIndex((it) => String(it.id) === String(product?.id));
  const isNewSku = idx < 0;
  let addedUnits = 0;

  if (!isNewSku) {
    const current = Math.max(0, Number(cart[idx].cantidad) || 0);
    const max = Number.isFinite(stock) ? stock : Infinity;
    const next = Math.min(current + quantity, max);
    addedUnits = Math.max(0, next - current);
    cart[idx] = {
      ...cart[idx],
      // refrescamos datos por si cambiaron en el back
      nombre: product?.nombre ?? cart[idx].nombre,
      precio: Number(product?.precio) || 0,
      precio_oferta: Number(product?.precio_oferta) || 0,
      descuento: Number(product?.descuento) || 0,
      imagen_principal: product?.imagen_principal ?? cart[idx].imagen_principal,
      stock: Number(product?.stock) || 0,
      cantidad: next,
    };
  } else {
    // al ser nuevo, las unidades agregadas equivalen a 'quantity'
    addedUnits = quantity;
    cart.push({
      id: product?.id,
      nombre: product?.nombre ?? "Producto",
      precio: Number(product?.precio) || 0,
      precio_oferta: Number(product?.precio_oferta) || 0,
      descuento: Number(product?.descuento) || 0,
      imagen_principal: product?.imagen_principal ?? null,
      stock: Number(product?.stock) || 0,
      cantidad: quantity,
    });
  }

  // 👉 Emite isNewSku y addedUnits (para animaciones diferenciadas)
  return writeCart(cart, { lastAction: "add", isNewSku, addedUnits });
}

export function updateQty(productId, qty) {
  const cart = readCart();
  const idx = cart.findIndex((it) => String(it.id) === String(productId));
  if (idx >= 0) {
    const stock = Number(cart[idx]?.stock);
    cart[idx].cantidad = clampQty(qty, Number.isFinite(stock) ? stock : undefined);
    return writeCart(cart, { lastAction: "updateQty" });
  }
  return cart;
}

export function removeFromCart(productId) {
  const cart = readCart().filter((it) => String(it.id) !== String(productId));
  return writeCart(cart, { lastAction: "remove" });
}

/* ---------- precios y contadores ---------- */
export function effectiveUnitPrice(item) {
  const base = Number(item?.precio) || 0;
  if (item?.precio_oferta && Number(item.precio_oferta) > 0) return Number(item.precio_oferta);
  if (item?.descuento && Number(item.descuento) > 0) {
    const pct = Number(item.descuento) / 100;
    return Math.max(0, base * (1 - pct));
  }
  return base;
}

export function cartTotals() {
  const cart = readCart();
  const { subtotal, units } = snapshot(cart);
  return { subtotal, items: cart.length, units }; // items = SKUs (compat)
}

// 🔢 Para useCartCount (y otros usos)
export function getTotals() {
  const { subtotal, items, units } = cartTotals();
  return { subtotal, count: items, units };
}

export function cartCountSkus() {
  return readCart().length;
}

export function cartCountUnits() {
  return readCart().reduce((acc, it) => acc + (Number(it.cantidad) || 1), 0);
}

/* ---------- suscripción opcional ---------- */
export function onCartChanged(handler) {
  const listener = (e) => {
    try {
      handler?.(e.detail || {});
    } catch {}
  };
  try {
    window.addEventListener("cart:changed", listener);
    return () => window.removeEventListener("cart:changed", listener);
  } catch {
    return () => {};
  }
}
