/* =========================================================
   SHIFT AUTO SUPPLY — Cart
   State management, persistence, UI sync
   ========================================================= */

const cart = {
  _items: [],
  _listeners: [],

  // ── Initialization ──────────────────────────────────────
  init() {
    try {
      const stored = localStorage.getItem('sas_cart');
      if (stored) this._items = JSON.parse(stored);
    } catch {
      this._items = [];
    }
    this._sync();
    return this;
  },

  // ── State Accessors ─────────────────────────────────────
  get items()    { return this._items; },
  get count()    { return this._items.reduce((sum, i) => sum + i.quantity, 0); },
  get subtotal() { return this._items.reduce((sum, i) => sum + (i.price * i.quantity), 0); },
  get isEmpty()  { return this._items.length === 0; },

  // ── Mutations ───────────────────────────────────────────
  add(product, quantity = 1) {
    const existing = this._items.find(i => i._id === product._id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock || 99);
    } else {
      this._items.push({
        _id:      product._id,
        name:     product.name,
        brand:    product.brand,
        sku:      product.sku,
        price:    product.salePrice && product.salePrice < product.price
          ? product.salePrice
          : product.price,
        stock:    product.stock,
        image:    product.images?.[0]?.url || null,
        slug:     product.slug,
        quantity: Math.min(quantity, product.stock || 99),
      });
    }
    this._persist();
    this._sync();
    this._notify('add', product);
    window.SAS?.toast?.success(`"${product.name}" added to cart`, 2500);
    return this;
  },

  remove(productId) {
    const idx = this._items.findIndex(i => i._id === productId);
    if (idx !== -1) {
      const item = this._items[idx];
      this._items.splice(idx, 1);
      this._persist();
      this._sync();
      this._notify('remove', item);
    }
    return this;
  },

  updateQty(productId, quantity) {
    const item = this._items.find(i => i._id === productId);
    if (!item) return this;
    if (quantity <= 0) return this.remove(productId);
    item.quantity = Math.min(quantity, item.stock || 99);
    this._persist();
    this._sync();
    this._notify('update', item);
    return this;
  },

  clear() {
    this._items = [];
    this._persist();
    this._sync();
    this._notify('clear');
    return this;
  },

  getItem(productId) {
    return this._items.find(i => i._id === productId);
  },

  // ── Persistence ─────────────────────────────────────────
  _persist() {
    try {
      localStorage.setItem('sas_cart', JSON.stringify(this._items));
    } catch {}
  },

  // ── UI Sync ─────────────────────────────────────────────
  _sync() {
    const count = this.count;

    // Update all cart count badges
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.classList.toggle('visible', count > 0);
    });

    // Update cart total displays
    document.querySelectorAll('[data-cart-total]').forEach(el => {
      el.textContent = window.SAS?.utils?.formatPrice(this.subtotal) || `$${this.subtotal.toFixed(2)}`;
    });

    // Update cart item count text
    document.querySelectorAll('[data-cart-items-count]').forEach(el => {
      el.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    });

    // Sticky cart bar
    const stickyBar = document.querySelector('.sticky-cart-bar');
    if (stickyBar) {
      stickyBar.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  // ── Event System ────────────────────────────────────────
  on(fn) { this._listeners.push(fn); },
  _notify(event, data) {
    this._listeners.forEach(fn => fn(event, data));
  },

  // ── Render Helpers ──────────────────────────────────────
  renderItems(container, options = {}) {
    if (!container) return;

    if (this.isEmpty) {
      container.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-muted);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="margin: 0 auto 16px; display:block; opacity:0.4">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p style="font-size:16px; font-weight:600; color:var(--text-primary); margin-bottom:8px;">Your cart is empty</p>
          <p style="font-size:14px; margin-bottom:20px;">Add some parts to get started</p>
          <a href="/pages/shop.html" class="btn btn-primary btn-sm">Browse Parts</a>
        </div>
      `;
      return;
    }

    container.innerHTML = this._items.map(item => `
      <div class="cart-item" data-item-id="${item._id}">
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted)"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
          }
        </div>
        <div class="cart-item-info">
          <div class="cart-item-brand">${item.brand || ''}</div>
          <a href="/pages/product.html?slug=${item.slug}" class="cart-item-name">${item.name}</a>
          <div class="cart-item-sku">SKU: ${item.sku || '—'}</div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
            <div class="qty-control">
              <button class="qty-btn" onclick="SAS.cart.updateQty('${item._id}', ${item.quantity - 1})">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="SAS.cart.updateQty('${item._id}', ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-price">${window.SAS?.utils?.formatPrice(item.price * item.quantity) || `$${(item.price * item.quantity).toFixed(2)}`}</div>
          </div>
          <button class="cart-item-remove" onclick="SAS.cart.remove('${item._id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Remove
          </button>
        </div>
      </div>
    `).join('');
  },

  renderSummary(container) {
    if (!container) return;
    const shipping = 0; // Shipping determined by owner after order
    const total = this.subtotal + shipping;

    container.innerHTML = `
      <div class="order-summary-row">
        <span class="label">Subtotal (${this.count} item${this.count !== 1 ? 's' : ''})</span>
        <span>${window.SAS?.utils?.formatPrice(this.subtotal) || `$${this.subtotal.toFixed(2)}`}</span>
      </div>
      <div class="order-summary-row">
        <span class="label">Shipping</span>
        <span style="font-size:12px;color:var(--text-muted)">Quoted after order</span>
      </div>
      ${this.subtotal > 0 && this.subtotal < 500 ? `
      <div class="order-summary-row" style="font-size:12px; color:var(--blue)">
        <span style="font-size:12px;color:var(--text-muted)">Shipping calculated after order</span>
      </div>` : ''}
      <div class="order-summary-row total">
        <span>Total</span>
        <span class="price">${window.SAS?.utils?.formatPrice(total) || `$${total.toFixed(2)}`}</span>
      </div>
    `;
  },
};

document.addEventListener('DOMContentLoaded', () => cart.init());
window.SAS = window.SAS || {};
window.SAS.cart = cart;
