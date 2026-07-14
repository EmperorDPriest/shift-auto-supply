/* =========================================================
   SHIFT AUTO SUPPLY — Auth State
   Login, logout, session persistence, role checks
   ========================================================= */

const auth = {
  _user: null,
  _listeners: [],

  get user()          { return this._user; },
  get isLoggedIn()    { return !!this._user; },
  get isAdmin()       { return this._user?.role === 'admin'; },
  get accessToken()   { return localStorage.getItem('sas_access_token'); },

  // ── Initialize ─────────────────────────────────────────
  async init() {
    const stored = localStorage.getItem('sas_user');
    if (stored) {
      try { this._user = JSON.parse(stored); } catch {}
    }

    if (this.accessToken) {
      try {
        const res = await window.SAS.authAPI.getMe();
        this._setUser(res.data);
      } catch {
        // Token invalid — clear and stay as guest
        this._clearUser();
      }
    }

    this._updateUI();
    return this._user;
  },

  // ── Login ───────────────────────────────────────────────
  async login(email, password) {
    const res = await window.SAS.authAPI.login({ email, password });
    const { user, accessToken } = res.data;
    localStorage.setItem('sas_access_token', accessToken);
    this._setUser(user);
    this._updateUI();
    this._notify('login', user);
    return user;
  },

  // ── Register ────────────────────────────────────────────
  async register(name, email, password, phone) {
    const res = await window.SAS.authAPI.register({ name, email, password, phone });
    const { user, accessToken } = res.data;
    localStorage.setItem('sas_access_token', accessToken);
    this._setUser(user);
    this._updateUI();
    this._notify('register', user);
    return user;
  },

  // ── Logout ──────────────────────────────────────────────
  async logout() {
    try { await window.SAS.authAPI.logout(); } catch {}
    localStorage.removeItem('sas_access_token');
    this._clearUser();
    this._updateUI();
    this._notify('logout');
    window.location.href = '/';
  },

  // ── Require auth (redirect to login if not authed) ──────
  requireAuth(redirectUrl = window.location.href) {
    if (!this.isLoggedIn) {
      sessionStorage.setItem('sas_redirect_after_login', redirectUrl);
      window.location.href = '/pages/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdmin) {
      window.location.href = '/';
      return false;
    }
    return true;
  },

  // ── Internal ────────────────────────────────────────────
  _setUser(user) {
    this._user = user;
    localStorage.setItem('sas_user', JSON.stringify(user));
  },

  _clearUser() {
    this._user = null;
    localStorage.removeItem('sas_user');
    localStorage.removeItem('sas_access_token');
  },

  _notify(event, data) {
    this._listeners.forEach(fn => fn(event, data));
  },

  on(fn) { this._listeners.push(fn); },

  _updateUI() {
    // Update header UI based on auth state
    const authLinks   = document.querySelectorAll('[data-auth-show]');
    const guestLinks  = document.querySelectorAll('[data-guest-show]');
    const adminLinks  = document.querySelectorAll('[data-admin-show]');
    const userNameEls = document.querySelectorAll('[data-user-name]');
    const userEmailEls = document.querySelectorAll('[data-user-email]');

    authLinks.forEach(el => {
      el.style.display = this.isLoggedIn ? '' : 'none';
    });
    guestLinks.forEach(el => {
      el.style.display = this.isLoggedIn ? 'none' : '';
    });
    adminLinks.forEach(el => {
      el.style.display = this.isAdmin ? '' : 'none';
    });
    userNameEls.forEach(el => {
      el.textContent = this._user?.name || '';
    });
    userEmailEls.forEach(el => {
      el.textContent = this._user?.email || '';
    });
  },
};

// Dark mode
const themeManager = {
  init() {
    const stored = localStorage.getItem('sas_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.set(stored);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.set(current === 'dark' ? 'light' : 'dark');
  },
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sas_theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(el => {
      el.setAttribute('aria-checked', theme === 'dark');
    });
  },
};

// Toast notifications
const toast = {
  _container: null,
  _icons: {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  },

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = 'info', duration = 4000) {
    const container = this._getContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${this._icons[type] || this._icons.info}</span>
      <span>${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    container.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'fadeIn 0.2s ease reverse both';
      setTimeout(() => el.remove(), 200);
    }, duration);

    return el;
  },

  success: (msg, dur)  => toast.show(msg, 'success', dur),
  error:   (msg, dur)  => toast.show(msg, 'error', dur || 6000),
  info:    (msg, dur)  => toast.show(msg, 'info', dur),
};

// Utility helpers
const utils = {
  formatPrice: (amount) => `$${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
  formatDate: (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  formatDateTime: (dateStr) => new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  slugToTitle: (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  getQueryParam: (key) => new URLSearchParams(window.location.search).get(key),
  getStatusLabel(status) {
    const map = {
      pending:      'Pending',
      under_review: 'Under Review',
      confirmed:    'Confirmed',
      processing:   'Processing',
      shipped:      'Shipped',
      delivered:    'Delivered',
      cancelled:    'Cancelled',
      failed:       'Failed',
    };
    return map[status] || status;
  },
  getStatusBadgeClass(status) {
    const map = {
      pending:      'badge-yellow',
      under_review: 'badge-yellow',
      confirmed:    'badge-green',
      processing:   'badge-blue',
      shipped:      'badge-blue',
      delivered:    'badge-green',
      cancelled:    'badge-crimson',
      failed:       'badge-crimson',
    };
    return map[status] || 'badge-gray';
  },
  renderStars(rating, max = 5) {
    return Array.from({ length: max }, (_, i) => {
      const filled = i < Math.floor(rating);
      const half   = !filled && i < rating;
      return `<svg class="star ${filled ? '' : half ? 'half' : 'empty'}" viewBox="0 0 24 24">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" 
          fill="${filled || half ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"/>
      </svg>`;
    }).join('');
  },
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  themeManager.init();

  // Theme toggle listeners
  document.querySelectorAll('.theme-toggle').forEach(el => {
    el.addEventListener('click', () => themeManager.toggle());
  });

  // Init auth
  if (window.SAS?.authAPI) {
    await auth.init();
  }

  // Drawer functionality
  document.querySelectorAll('[data-drawer-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-drawer-open');
      openDrawer(id);
    });
  });
  document.querySelectorAll('[data-drawer-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-drawer-close') || 
        btn.closest('.drawer')?.id;
      closeDrawer(id);
    });
  });
  document.querySelectorAll('.drawer-overlay').forEach(overlay => {
    overlay.addEventListener('click', () => {
      document.querySelectorAll('.drawer.active').forEach(d => closeDrawer(d.id));
    });
  });
});

function openDrawer(id) {
  const drawer  = document.getElementById(id);
  const overlay = document.querySelector('.drawer-overlay');
  if (!drawer) return;
  drawer.classList.add('active');
  overlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(id) {
  const drawer  = id ? document.getElementById(id) : document.querySelector('.drawer.active');
  const overlay = document.querySelector('.drawer-overlay');
  if (!drawer) return;
  drawer.classList.remove('active');
  overlay?.classList.remove('active');
  document.body.style.overflow = '';
}

window.SAS = window.SAS || {};
Object.assign(window.SAS, { auth, themeManager, toast, utils, openDrawer, closeDrawer });
