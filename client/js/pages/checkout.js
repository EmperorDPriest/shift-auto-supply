/* =========================================================
   SHIFT AUTO SUPPLY — Checkout JS (Fixed)
   ========================================================= */
let selectedPaymentMethod = null;
let paymentMethods = [];

// ── Render Cart in Sidebar ────────────────────────────────
function renderCheckoutCart() {
  const itemsEl  = document.getElementById('checkoutItems');
  const totalsEl = document.getElementById('checkoutTotals');
  if (!itemsEl || !totalsEl) return;

  // Only redirect if cart is truly empty AND we're not already on payment step
  if (SAS.cart.isEmpty) {
    window.location.href = '/pages/shop.html';
    return;
  }

  itemsEl.innerHTML = SAS.cart.items.map(item => `
    <div class="checkout-item">
      <div class="checkout-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
        <div class="checkout-item-qty">${item.quantity}</div>
      </div>
      <div class="checkout-item-name">
        ${item.name}<br>
        <span style="font-size:11px;color:var(--text-muted);font-weight:400">${item.brand || ''}</span>
      </div>
      <div class="checkout-item-price">${SAS.utils.formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  totalsEl.innerHTML = `
    <div class="order-summary-row"><span class="label">Subtotal</span><span>${SAS.utils.formatPrice(SAS.cart.subtotal)}</span></div>
    <div class="order-summary-row"><span class="label">Shipping</span><span style="font-size:12px;color:var(--text-muted)">Calculated after order</span></div>
    <div class="order-summary-row total"><span>Total</span><span class="price">${SAS.utils.formatPrice(SAS.cart.subtotal)}</span></div>
  `;
}

// ── Load Payment Methods ──────────────────────────────────
async function loadPaymentMethods() {
  const container = document.getElementById('paymentMethodsList');
  if (!container) return;

  try {
    const res = await SAS.paymentsAPI.getMethods();
    paymentMethods = res.data;

    const available = paymentMethods.filter(m => m.name !== 'creditcard');

    if (!available.length) {
      container.innerHTML = `<div class="alert alert-warning"><div>No payment methods are currently available. Please contact support.</div></div>`;
      return;
    }

    const icons = {
      zelle:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
      paypal:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11l5-7h4a4 4 0 0 1 4 4c0 3-2.5 5-5 5H9l-1 7H5L7 11z"/></svg>`,
      cashapp:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      applepay: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><polyline points="12 8 8 14 12 14 11 20 16 12 12 12 13 6"/></svg>`,
    };

    container.innerHTML = available.map(method => {
      const isMaintenance = method.isMaintenanceMode;
      const isInactive    = !method.isActive;
      const disabled      = isMaintenance || isInactive;

      return `
        <div class="payment-card ${isMaintenance ? 'maintenance' : ''} ${isInactive ? 'inactive' : ''}"
          id="pm_${method._id}"
          ${disabled ? '' : `onclick="selectPayment('${method._id}')" role="button" tabindex="0"`}>
          <div class="payment-card-header">
            <div class="payment-card-left">
              <div class="payment-card-icon">${icons[method.name] || icons.paypal}</div>
              <div>
                <div class="payment-card-name">${method.displayName}</div>
                <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-top:2px">
                  <span class="payment-status-dot ${disabled ? 'maintenance' : 'active'}"></span>
                  ${isMaintenance ? 'Under Maintenance' : isInactive ? 'Unavailable' : 'Available'}
                </div>
              </div>
            </div>
            ${!disabled ? `<div class="payment-card-radio" id="radio_${method._id}"></div>` : ''}
          </div>
          ${disabled ? `<div class="payment-card-maintenance-msg">${method.maintenanceMessage || 'Currently unavailable.'}</div>` : ''}
        </div>
      `;
    }).join('');

    // Always append credit card as unavailable
    container.innerHTML += `
      <div class="payment-card inactive">
        <div class="payment-card-header">
          <div class="payment-card-left">
            <div class="payment-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <div class="payment-card-name">Credit / Debit Card</div>
              <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-top:2px">
                <span class="payment-status-dot maintenance"></span>Currently Unavailable
              </div>
            </div>
          </div>
        </div>
        <div class="payment-card-maintenance-msg">Credit card processing is not currently available.</div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><div>Failed to load payment methods. Please refresh the page.</div></div>`;
  }
}

// ── Select Payment Method ─────────────────────────────────
function selectPayment(methodId) {
  selectedPaymentMethod = methodId;

  document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('selected'));
  document.querySelectorAll('[id^="radio_"]').forEach(r => {
    r.style.cssText = '';
    r.innerHTML = '';
  });

  const selectedCard  = document.getElementById(`pm_${methodId}`);
  const selectedRadio = document.getElementById(`radio_${methodId}`);

  if (selectedCard) selectedCard.classList.add('selected');
  if (selectedRadio) {
    selectedRadio.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;background:var(--bg-card);flex-shrink:0';
    selectedRadio.innerHTML = '<div style="width:10px;height:10px;background:var(--blue);border-radius:50%"></div>';
  }

  // Show account details for selected method
  showMethodDetails(methodId);
}

function showMethodDetails(methodId) {
  const method = paymentMethods.find(m => m._id === methodId);
  if (!method) return;

  // Show instructions as a small hint below the cards
  let detailsHtml = '';
  // If account values are not present (public list hides values), fetch details for this method
  const hasValues = method.accountDetails?.some(d => d.value);
  const renderDetails = (m) => {
    if (!m.accountDetails?.length) return '';
    return `<div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--blue-50);border:1px solid var(--blue-100);border-radius:var(--radius-md)">
      <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:var(--space-2)">Payment details</div>
      ${m.accountDetails.map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px">
          <div style="font-size:13px;color:var(--text-secondary)">${d.label}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="font-weight:700">${d.value || '—'}</div>
            ${d.value ? `<button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText('${d.value}').then(()=>SAS.toast.success('Copied'))">Copy</button>` : ''}
          </div>
        </div>
      `).join('')}
      ${m.instructions ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:6px">${m.instructions}</div>` : ''}
    </div>`;
  };

  if (hasValues) {
    detailsHtml += renderDetails(method);
  } else {
    // Fetch details for this specific method (server returns values only for active methods)
    detailsHtml += `<div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md)">Loading payment details…</div>`;
   // Account values are shown on the payment-upload page after order is placed
   // Just show instructions here as a lightweight hint
   const hintEl = document.getElementById('paymentMethodHint');
   if (hintEl) hintEl.innerHTML = method.instructions
     ? `<div style="margin-top:var(--space-4);padding:var(--space-4);background:var(--blue-50);border:1px solid var(--blue-100);border-radius:var(--radius-md)"><div style="font-size:13px;color:var(--text-secondary)">${method.instructions}</div></div>`
     : '';
  }

  // Inject below the payment list
  let hint = document.getElementById('paymentMethodHint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'paymentMethodHint';
    document.getElementById('paymentMethodsList')?.after(hint);
  }
  hint.innerHTML = detailsHtml;
}

// ── Navigation ────────────────────────────────────────────
function goToPayment() {
  const name    = document.getElementById('shipName')?.value?.trim();
  const street  = document.getElementById('shipStreet')?.value?.trim();
  const city    = document.getElementById('shipCity')?.value?.trim();
  const country = document.getElementById('shipCountry')?.value?.trim();
  const zip     = document.getElementById('shipZip')?.value?.trim();
  const email   = document.getElementById('guestEmail')?.value?.trim();

  if (!name)    { SAS.toast.error('Full name is required');             return; }
  if (!street)  { SAS.toast.error('Street address is required');        return; }
  if (!city)    { SAS.toast.error('City is required');                  return; }
  if (!country) { SAS.toast.error('Country is required');               return; }
  if (!zip)     { SAS.toast.error('ZIP / postal code is required');     return; }
  if (!SAS.auth.isLoggedIn && !email) { SAS.toast.error('Email is required for guest checkout'); return; }

  document.getElementById('stepShipping').style.display = 'none';
  document.getElementById('stepPayment').style.display  = 'block';
  document.getElementById('step1Indicator')?.classList.add('completed');
  document.getElementById('step2Indicator')?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load payment methods now that the panel is visible
  loadPaymentMethods();
}

function backToShipping() {
  document.getElementById('stepPayment').style.display  = 'none';
  document.getElementById('stepShipping').style.display = 'block';
  document.getElementById('step2Indicator')?.classList.remove('active');
  document.getElementById('step1Indicator')?.classList.remove('completed');
}

// ── Place Order ───────────────────────────────────────────
async function placeOrder() {
  if (!selectedPaymentMethod) {
    SAS.toast.error('Please select a payment method');
    return;
  }

  const method = paymentMethods.find(m => m._id === selectedPaymentMethod);
  if (!method) { SAS.toast.error('Invalid payment method selected'); return; }

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled   = true;
  btn.textContent = 'Placing Order…';

  const guestEmail = document.getElementById('guestEmail')?.value?.trim();

  const shipping = {
    name:    document.getElementById('shipName').value.trim(),
    email:   SAS.auth.isLoggedIn ? SAS.auth.user.email : guestEmail,
    phone:   document.getElementById('shipPhone')?.value?.trim() || '',
    street:  document.getElementById('shipStreet').value.trim(),
    city:    document.getElementById('shipCity').value.trim(),
    state:   document.getElementById('shipState')?.value?.trim() || '',
    country: document.getElementById('shipCountry').value.trim(),
    zip:     document.getElementById('shipZip').value.trim(),
  };

  const items = SAS.cart.items.map(i => ({
    productId: i._id,
    name:      i.name,
    quantity:  i.quantity,
  }));

  try {
    const res = await SAS.ordersAPI.create({
      items,
      shipping,
      paymentMethod: method.name,
      guestEmail: SAS.auth.isLoggedIn ? null : guestEmail,
    });

    const { orderId, orderNumber, total } = res.data;

    // Clear cart AFTER successful order creation
    SAS.cart.clear();

    // Save pending order to session so payment-upload page can read account details
    try {
      const pending = {
        orderId,
        orderNumber,
        total,
        paymentMethod: { name: method.name, displayName: method.displayName },
        paymentMethods, // include available methods snapshot
      };
      sessionStorage.setItem('sas_pending_order', JSON.stringify(pending));
    } catch (e) {
      // ignore session storage errors
    }

    window.location.href = `/pages/payment-upload.html?orderId=${orderId}&orderNumber=${encodeURIComponent(orderNumber)}&method=${method.name}&total=${total}`;

  } catch (err) {
    SAS.toast.error(err.message || 'Failed to place order. Please try again.');
    btn.disabled    = false;
    btn.innerHTML   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Place Order`;
  }
}

function applyCoupon() {
  SAS.toast.info('Coupon codes coming soon!');
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render cart — this will redirect if truly empty
  renderCheckoutCart();

  // Pre-fill name if logged in, hide guest email
  if (SAS.auth?.isLoggedIn) {
    const gs = document.getElementById('guestEmailSection');
    if (gs) gs.style.display = 'none';
    const nameEl = document.getElementById('shipName');
    if (nameEl && SAS.auth.user?.name) nameEl.value = SAS.auth.user.name;
  }

  // NOTE: loadPaymentMethods() is called inside goToPayment()
  // so it only runs when the payment step becomes visible — not on page load
});
