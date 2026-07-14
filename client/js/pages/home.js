/* =========================================================
   SHIFT AUTO SUPPLY — Homepage JS
   ========================================================= */

// ── Vehicle Data ──────────────────────────────────────────
const VEHICLE_DATA = {
  BMW: {
    models: ['1 Series','2 Series','3 Series','4 Series','5 Series','6 Series','7 Series','8 Series','M2','M3','M4','M5','M8','X1','X2','X3','X4','X5','X6','X7','Z4','i3','i4','i8'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Toyota: {
    models: ['Camry','Corolla','RAV4','Highlander','4Runner','Tacoma','Tundra','Supra','Prius','Sienna'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Mercedes: {
    models: ['C-Class','E-Class','S-Class','GLC','GLE','GLS','A-Class','CLA','AMG GT'],
    years: Array.from({ length: 25 }, (_, i) => 2025 - i),
  },
  Honda: {
    models: ['Civic','Accord','CR-V','Pilot','HR-V','Ridgeline','Odyssey','Passport'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Ford: {
    models: ['F-150','Mustang','Explorer','Escape','Edge','Bronco','Ranger','Expedition'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Chevrolet: {
    models: ['Silverado','Equinox','Traverse','Tahoe','Suburban','Camaro','Colorado','Blazer'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Nissan: {
    models: ['Altima','Sentra','Rogue','Pathfinder','Frontier','Titan','Armada','370Z','GT-R'],
    years: Array.from({ length: 30 }, (_, i) => 2025 - i),
  },
  Hyundai: {
    models: ['Elantra','Sonata','Tucson','Santa Fe','Palisade','Kona','Venue','Genesis'],
    years: Array.from({ length: 20 }, (_, i) => 2025 - i),
  },
};

// ── Finder Logic ──────────────────────────────────────────
function updateFinderModels() {
  const brand    = document.getElementById('finderBrand')?.value;
  const modelSel = document.getElementById('finderModel');
  const yearSel  = document.getElementById('finderYear');
  if (!modelSel || !yearSel) return;

  modelSel.innerHTML = '<option value="">Select Model</option>';
  yearSel.innerHTML  = '<option value="">Select Year</option>';

  if (!brand || !VEHICLE_DATA[brand]) return;

  const data = VEHICLE_DATA[brand];
  data.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = m;
    modelSel.appendChild(opt);
  });

  modelSel.addEventListener('change', () => {
    yearSel.innerHTML = '<option value="">Select Year</option>';
    data.years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = y;
      yearSel.appendChild(opt);
    });
  }, { once: true });

  // Re-add for future brand changes
  modelSel.onchange = () => {
    yearSel.innerHTML = '<option value="">Select Year</option>';
    data.years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = y;
      yearSel.appendChild(opt);
    });
  };
}

function handleFinderSubmit(e) {
  e.preventDefault();
  const brand = document.getElementById('finderBrand')?.value;
  const model = document.getElementById('finderModel')?.value;
  const year  = document.getElementById('finderYear')?.value;
  if (!brand || !model || !year) {
    SAS.toast.error('Please select brand, model, and year');
    return;
  }
  const params = new URLSearchParams({ brand, model, year });
  window.location.href = `/pages/shop.html?${params}`;
}

// ── Search Logic ──────────────────────────────────────────
function initSearch() {
  const input       = document.getElementById('headerSearchInput');
  const suggestions = document.getElementById('searchSuggestions');
  if (!input || !suggestions) return;

  const doSearch = SAS.utils.debounce(async (query) => {
    if (query.length < 2) {
      suggestions.style.display = 'none';
      return;
    }

    try {
      const res = await SAS.productsAPI.getAll({ q: query, limit: 6 });
      const products = res.data.products;

      if (!products.length) {
        suggestions.style.display = 'none';
        return;
      }

      suggestions.innerHTML = products.map(p => `
        <a href="/pages/product.html?slug=${p.slug}" class="search-suggestion-item">
          ${p.images?.[0]?.url
            ? `<img src="${p.images[0].url}" alt="${p.name}">`
            : `<div style="width:40px;height:40px;background:var(--bg-elevated);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
          }
          <div style="flex:1;min-width:0">
            <div class="search-suggestion-name truncate">${p.name}</div>
            <div class="search-suggestion-brand">${p.brand} &bull; SKU: ${p.sku}</div>
          </div>
          <div class="search-suggestion-price">${SAS.utils.formatPrice(p.salePrice || p.price)}</div>
        </a>
      `).join('') + `
        <a href="/pages/shop.html?q=${encodeURIComponent(query)}" style="display:flex;align-items:center;gap:8px;padding:10px 16px;font-size:13px;color:var(--blue);font-weight:600;border-top:1px solid var(--border)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          View all results for "${query}"
        </a>
      `;
      suggestions.style.display = 'block';
    } catch {
      suggestions.style.display = 'none';
    }
  }, 300);

  input.addEventListener('input', (e) => doSearch(e.target.value.trim()));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `/pages/shop.html?q=${encodeURIComponent(input.value.trim())}`;
    }
    if (e.key === 'Escape') suggestions.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#headerSearch')) suggestions.style.display = 'none';
  });
}

// Mobile search
function doMobileSearch() {
  const q = document.getElementById('mobileSearchInput')?.value?.trim();
  if (q) window.location.href = `/pages/shop.html?q=${encodeURIComponent(q)}`;
}
document.getElementById('mobileSearchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doMobileSearch();
});

// ── Featured Products ─────────────────────────────────────
async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  try {
    const res = await SAS.productsAPI.getFeatured();
    const products = res.data;

    if (!products.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
        <p>No featured products yet. Check back soon!</p>
        <a href="/pages/shop.html" class="btn btn-primary btn-sm" style="margin-top:16px">Browse All Parts</a>
      </div>`;
      return;
    }

    grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  } catch {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
      <p>Unable to load products. Please refresh the page.</p>
    </div>`;
  }
}

function renderProductCard(product) {
  const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
  const isOnSale = product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stock === 0;
  const discountPct = isOnSale ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;

  return `
    <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-product-id="${product._id}">
      <a href="/pages/product.html?slug=${product.slug}" class="product-card-img">
        ${product.images?.[0]?.url
          ? `<img src="${product.images[0].url}" alt="${product.name}" loading="lazy">`
          : `<div class="product-card-img-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>`
        }
        <div class="product-card-badges">
          ${isOnSale ? `<span class="badge badge-crimson">-${discountPct}%</span>` : ''}
          ${product.condition !== 'new' ? `<span class="badge badge-gray">${product.condition}</span>` : ''}
          ${product.isFeatured ? `<span class="badge badge-blue">Featured</span>` : ''}
        </div>
        <button class="product-card-wishlist" aria-label="Save to wishlist">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </a>
      <div class="product-card-body">
        <div class="product-card-brand">${product.brand}</div>
        <a href="/pages/product.html?slug=${product.slug}" class="product-card-name">${product.name}</a>
        ${product.vehicleModels?.length
          ? `<div class="product-card-compat">
              Fits: ${product.vehicleModels.slice(0,2).map(v => `${v.brand} ${v.model}`).join(', ')}
              ${product.vehicleModels.length > 2 ? ` +${product.vehicleModels.length - 2} more` : ''}
            </div>`
          : ''
        }
        ${product.averageRating > 0
          ? `<div class="product-card-rating">
              <div class="stars">
                ${Array.from({ length: 5 }, (_, i) =>
                  `<svg class="star ${i < Math.round(product.averageRating) ? '' : 'empty'}" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                      fill="${i < Math.round(product.averageRating) ? 'currentColor' : 'none'}"
                      stroke="currentColor" stroke-width="1.5"/>
                  </svg>`
                ).join('')}
              </div>
              <span>(${product.reviewCount})</span>
            </div>`
          : ''
        }
      </div>
      <div class="product-card-footer">
        <div class="product-price">
          ${isOnSale
            ? `<span class="product-price-sale">${SAS.utils.formatPrice(product.salePrice)}</span>
               <span class="product-price-original">${SAS.utils.formatPrice(product.price)}</span>`
            : `<span class="product-price-current">${SAS.utils.formatPrice(price)}</span>`
          }
        </div>
        <button class="product-card-add" 
          onclick="event.preventDefault();addToCartById('${product._id}')"
          ${isOutOfStock ? 'disabled' : ''}
          aria-label="Add to cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>
  `;
}

// Store product data for add to cart
let productCache = {};

async function addToCartById(productId) {
  // Check cache first
  if (productCache[productId]) {
    SAS.cart.add(productCache[productId]);
    return;
  }

  try {
    // Find from DOM parent context — get from featured list
    const res = await SAS.productsAPI.getFeatured();
    res.data.forEach(p => { productCache[p._id] = p; });
    if (productCache[productId]) {
      SAS.cart.add(productCache[productId]);
    }
  } catch {
    SAS.toast.error('Could not add to cart. Please try again.');
  }
}

// ── Newsletter ────────────────────────────────────────────
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Subscribed!';
  btn.disabled = true;
  SAS.toast.success('You\'re subscribed! We\'ll be in touch.');
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.disabled = false;
    e.target.reset();
  }, 4000);
}

// ── Swiper Init ───────────────────────────────────────────
function initSwipers() {
  // Hero swiper
  if (document.querySelector('.hero-swiper')) {
    new Swiper('.hero-swiper', {
      loop: true,
      autoplay: { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true },
      speed: 800,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      pagination: {
        el: '.hero-swiper .swiper-pagination',
        clickable: true,
      },
      navigation: {
        prevEl: '.hero-swiper .swiper-button-prev',
        nextEl: '.hero-swiper .swiper-button-next',
      },
      a11y: { enabled: true },
    });
  }

  // Reviews swiper
  if (document.querySelector('.reviews-swiper')) {
    new Swiper('.reviews-swiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      pagination: { el: '.reviews-pagination', clickable: true },
      breakpoints: {
        640:  { slidesPerView: 1.5 },
        900:  { slidesPerView: 2 },
        1200: { slidesPerView: 3 },
      },
      a11y: { enabled: true },
    });
  }
}

// ── Cart Drawer Sync ──────────────────────────────────────
function syncCartDrawer() {
  const itemsEl   = document.getElementById('cartDrawerItems');
  const summaryEl = document.getElementById('cartDrawerSummary');
  if (itemsEl)   SAS.cart.renderItems(itemsEl);
  if (summaryEl) SAS.cart.renderSummary(summaryEl);
}

// ── Footer Year ───────────────────────────────────────────
document.getElementById('currentYear')?.textContent && (
  document.getElementById('currentYear').textContent = new Date().getFullYear()
);

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  initSwipers();
  initSearch();
  loadFeaturedProducts();

  // Cart drawer sync on open
  SAS.cart.on((event) => {
    syncCartDrawer();
  });

  // Initial cart drawer render
  syncCartDrawer();

  // Animate rating bars on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.rating-bar > div').forEach(bar => {
          bar.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
        });
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.rating-summary').forEach(el => observer.observe(el));
});
