/* =========================================================
   SHIFT AUTO SUPPLY — Admin Dashboard JS
   ========================================================= */

function toggleSidebar() {
  document.getElementById('adminSidebar')?.classList.toggle('mobile-open');
}

async function loadDashboard() {
  try {
    const res  = await SAS.adminAPI.getAnalytics();
    const data = res.data;
    renderStats(data.overview);
    renderRecentOrders(data.recentOrders);
    renderTopProducts(data.topProducts);
    updatePendingBadge(data.overview.pendingPaymentReview);
  } catch (err) {
    SAS.toast.error('Failed to load dashboard data.');
  }
}

function renderStats(overview) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-info">
        <div class="stat-card-label">Revenue (30 days)</div>
        <div class="stat-card-value">${SAS.utils.formatPrice(overview.revenue30d)}</div>
        <div class="stat-card-change up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
          ${overview.orders30d} orders
        </div>
      </div>
      <div class="stat-card-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-info">
        <div class="stat-card-label">Total Orders</div>
        <div class="stat-card-value">${overview.totalOrders}</div>
        <div class="stat-card-change" style="color:var(--text-muted)">All time</div>
      </div>
      <div class="stat-card-icon green">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-info">
        <div class="stat-card-label">Pending Review</div>
        <div class="stat-card-value" style="${overview.pendingPaymentReview > 0 ? 'color:var(--crimson)' : ''}">${overview.pendingPaymentReview}</div>
        <div class="stat-card-change" style="color:var(--text-muted)">Awaiting verification</div>
      </div>
      <div class="stat-card-icon yellow">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-info">
        <div class="stat-card-label">Active Products</div>
        <div class="stat-card-value">${overview.totalProducts}</div>
        ${overview.lowStockProducts > 0
          ? `<div class="stat-card-change down"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>${overview.lowStockProducts} low stock</div>`
          : `<div class="stat-card-change" style="color:var(--text-muted)">${overview.totalCustomers} customers</div>`
        }
      </div>
      <div class="stat-card-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      </div>
    </div>
  `;
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;

  if (!orders?.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No orders yet</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><span style="font-family:var(--font-mono);font-size:12px;font-weight:600">${o.orderNumber}</span></td>
      <td style="max-width:140px">
        <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.shipping?.name || o.guestEmail || '—'}</div>
        <div style="font-size:11px;color:var(--text-muted)">${o.shipping?.country || ''}</div>
      </td>
      <td style="font-weight:700">${SAS.utils.formatPrice(o.total)}</td>
      <td><span class="badge ${SAS.utils.getStatusBadgeClass(o.paymentStatus)}">${SAS.utils.getStatusLabel(o.paymentStatus)}</span></td>
      <td><span class="badge ${SAS.utils.getStatusBadgeClass(o.orderStatus)}">${SAS.utils.getStatusLabel(o.orderStatus)}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${SAS.utils.formatDate(o.createdAt)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="openOrderModal('${o._id}')" title="View order">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderTopProducts(products) {
  const list = document.getElementById('topProductsList');
  if (!list || !products?.length) return;

  list.innerHTML = products.map((p, i) => `
    <div class="top-product-item">
      <div style="width:24px;text-align:center;font-size:13px;font-weight:700;color:var(--text-muted)">${i + 1}</div>
      <div class="top-product-img">
        ${p.images?.[0]?.url
          ? `<img src="${p.images[0].url}" alt="${p.name}">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
        }
      </div>
      <div style="flex:1;min-width:0">
        <div class="top-product-name truncate">${p.name}</div>
        <div class="top-product-views">${p.viewCount || 0} views &bull; ${p.salesCount || 0} sold</div>
      </div>
      <div style="font-size:13px;font-weight:700">${SAS.utils.formatPrice(p.price)}</div>
    </div>
  `).join('');
}

function updatePendingBadge(count) {
  const badge = document.getElementById('pendingBadge');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// Order Modal
async function openOrderModal(orderId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 style="font-size:16px;font-weight:700">Order Details</h3>
        <button class="drawer-close" onclick="this.closest('.modal-overlay').remove()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;padding:40px;color:var(--text-muted)">Loading…</div>
      </div>
    </div>
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);

  try {
    const res   = await SAS.ordersAPI.getAll({ limit: 1 });
    // We need a specific order endpoint — use admin get all and filter
    // In production, add GET /api/v1/orders/:id admin endpoint
    const order = res.data.orders.find(o => o._id === orderId);
    if (!order) throw new Error('Not found');

    const modalBody = overlay.querySelector('.modal-body');
    modalBody.innerHTML = renderOrderModalContent(order);
  } catch {
    const modalBody = overlay.querySelector('.modal-body');
    modalBody.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:40px">Failed to load order details.</p>`;
  }
}

function renderOrderModalContent(order) {
  return `
    <div style="margin-bottom:var(--space-5)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
        <div style="font-family:var(--font-mono);font-weight:700">${order.orderNumber}</div>
        <div style="display:flex;gap:8px">
          <span class="badge ${SAS.utils.getStatusBadgeClass(order.paymentStatus)}">${SAS.utils.getStatusLabel(order.paymentStatus)}</span>
          <span class="badge ${SAS.utils.getStatusBadgeClass(order.orderStatus)}">${SAS.utils.getStatusLabel(order.orderStatus)}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);font-size:13px">
        <div><span style="color:var(--text-muted)">Customer:</span> <strong>${order.shipping?.name}</strong></div>
        <div><span style="color:var(--text-muted)">Email:</span> ${order.shipping?.email || order.guestEmail || '—'}</div>
        <div><span style="color:var(--text-muted)">Payment:</span> ${order.paymentMethod}</div>
        <div><span style="color:var(--text-muted)">Total:</span> <strong style="color:var(--blue)">${SAS.utils.formatPrice(order.total)}</strong></div>
      </div>
    </div>

    <div style="border-top:1px solid var(--border);padding-top:var(--space-4);margin-bottom:var(--space-4)">
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">Items</div>
      ${order.items.map(i => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--divider);font-size:13px"><span>${i.name} ×${i.quantity}</span><span style="font-weight:700">${SAS.utils.formatPrice(i.price * i.quantity)}</span></div>`).join('')}
    </div>

    <div style="border-top:1px solid var(--border);padding-top:var(--space-4)">
      <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--space-3)">Update Status</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
        <div class="form-group">
          <label class="form-label">Order Status</label>
          <select id="modalOrderStatus" class="form-input" style="height:38px">
            ${['pending','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${order.orderStatus===s?'selected':''}>${SAS.utils.getStatusLabel(s)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Payment Status</label>
          <select id="modalPaymentStatus" class="form-input" style="height:38px">
            ${['pending','under_review','confirmed','failed'].map(s => `<option value="${s}" ${order.paymentStatus===s?'selected':''}>${SAS.utils.getStatusLabel(s)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--space-3)">
        <label class="form-label">Tracking Number</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="modalTrackingNum" class="form-input" placeholder="e.g. 1Z999AA10123456784" value="${order.tracking?.number || ''}" style="flex:1">
          <input type="text" id="modalTrackingProvider" class="form-input" placeholder="Carrier" value="${order.tracking?.provider || ''}" style="width:120px">
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--space-3)">
        <label class="form-label">Tracking URL</label>
        <input type="url" id="modalTrackingUrl" class="form-input" placeholder="https://track.carrier.com/..." value="${order.tracking?.url || ''}">
      </div>
      <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
        <button class="btn btn-primary" style="flex:1" onclick="saveOrderUpdates('${order._id}')">Save Changes</button>
        ${order.paymentProof?.url ? `<button type="button" class="btn btn-outline btn-sm" onclick="openOrderProof('${order._id}', false)">View Proof</button>` : ''}
      </div>
    </div>
  `;
}

function getAdminToken() {
  return localStorage.getItem('sas_access_token');
}

function getProofUrl(orderId, download = false) {
  return `${window.ENV.API_URL}/orders/${orderId}/proof${download ? '?download=true' : ''}`;
}

async function openOrderProof(orderId, download = false) {
  const token = getAdminToken();
  if (!token) {
    SAS.toast.error('You must be logged in as admin to view payment proof');
    return;
  }

  const url = getProofUrl(orderId, download);
  const newTab = window.open('', '_blank');
  if (!newTab) {
    SAS.toast.error('Unable to open proof viewer. Please allow popups for this site.');
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      let message = `Unable to load proof (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.message) message = errorData.message;
      } catch {}
      newTab.close();
      SAS.toast.error(message);
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (download) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `payment-proof-${orderId}.${blob.type.split('/').pop() || 'bin'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      newTab.close();
      return;
    }

    newTab.location = blobUrl;
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    if (newTab) newTab.close();
    SAS.toast.error(err.message || 'Failed to load payment proof');
  }
}

async function saveOrderUpdates(orderId) {
  const orderStatus   = document.getElementById('modalOrderStatus')?.value;
  const paymentStatus = document.getElementById('modalPaymentStatus')?.value;
  const trackingNum   = document.getElementById('modalTrackingNum')?.value?.trim();
  const trackingProv  = document.getElementById('modalTrackingProvider')?.value?.trim();
  const trackingUrl   = document.getElementById('modalTrackingUrl')?.value?.trim();

  try {
    await SAS.ordersAPI.updateStatus(orderId, { orderStatus, paymentStatus });

    if (trackingNum) {
      await SAS.ordersAPI.updateTracking(orderId, {
        number: trackingNum,
        provider: trackingProv,
        url: trackingUrl,
      });
    }

    SAS.toast.success('Order updated successfully');
    document.querySelector('.modal-overlay')?.remove();
    loadDashboard();
  } catch (err) {
    SAS.toast.error(err.message || 'Failed to update order');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Require admin
  await new Promise(r => setTimeout(r, 300)); // Wait for auth init
  if (!SAS.auth.isAdmin) {
    window.location.href = '/pages/login.html';
    return;
  }
  loadDashboard();
});
