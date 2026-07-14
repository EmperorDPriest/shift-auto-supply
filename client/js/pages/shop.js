/* Shop Page JS */
const shopState = { page:1,limit:24,sort:'-createdAt',filters:{},view:'grid',totalPages:1,loading:false };

function readParamsIntoState(){
  const p=new URLSearchParams(window.location.search);
  ['q','brand','model','year','category','condition','minPrice','maxPrice','inStock'].forEach(k=>{if(p.get(k))shopState.filters[k]=p.get(k);});
  if(p.get('sort'))shopState.sort=p.get('sort');
  if(p.get('page'))shopState.page=parseInt(p.get('page'))||1;
  const s=document.getElementById('sortSelect');if(s)s.value=shopState.sort;
  const h=document.getElementById('headerSearchInput');if(h&&shopState.filters.q)h.value=shopState.filters.q;
}

function pushStateToUrl(){
  const params=new URLSearchParams();
  Object.entries(shopState.filters).forEach(([k,v])=>{if(v)params.set(k,v);});
  if(shopState.sort!=='-createdAt')params.set('sort',shopState.sort);
  if(shopState.page>1)params.set('page',shopState.page);
  history.pushState({},'',`?${params.toString()}`);
}

async function loadProducts(page){
  if(shopState.loading)return;
  shopState.loading=true;
  if(page)shopState.page=page;
  const grid=document.getElementById('productsGrid');
  const emptyEl=document.getElementById('emptyState');
  const paginEl=document.getElementById('paginationContainer');
  grid.style.display='grid'; emptyEl.style.display='none';
  grid.innerHTML=Array(12).fill(`<div class="product-card" style="pointer-events:none"><div class="product-card-img skeleton" style="aspect-ratio:1"></div><div class="product-card-body" style="gap:10px"><div class="skeleton" style="height:10px;width:50%;border-radius:4px"></div><div class="skeleton" style="height:14px;width:90%;border-radius:4px"></div></div><div class="product-card-footer"><div class="skeleton" style="height:22px;width:70px;border-radius:4px"></div><div class="skeleton" style="height:36px;width:36px;border-radius:8px"></div></div></div>`).join('');
  const sortEl=document.getElementById('sortSelect');
  if(sortEl)shopState.sort=sortEl.value;
  try{
    const res=await SAS.productsAPI.getAll({page:shopState.page,limit:shopState.limit,sort:shopState.sort,...shopState.filters});
    const{products,pagination}=res.data;
    shopState.totalPages=pagination.pages;
    updateShopTitle();updateActiveFilters();
    const tEl=document.getElementById('totalResultsLabel');if(tEl)tEl.textContent=`${pagination.total} result${pagination.total!==1?'s':''}`;
    if(!products.length){grid.style.display='none';emptyEl.style.display='block';paginEl.innerHTML='';}
    else{grid.style.display='grid';emptyEl.style.display='none';grid.innerHTML=products.map(p=>renderCard(p)).join('');renderPagination(pagination);}
    pushStateToUrl();window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><p>Failed to load products.</p><button onclick="loadProducts()" class="btn btn-secondary btn-sm" style="margin-top:12px">Retry</button></div>`;}
  finally{shopState.loading=false;}
}

function renderCard(p){
  const price=p.salePrice&&p.salePrice<p.price?p.salePrice:p.price;
  const isOnSale=p.salePrice&&p.salePrice<p.price;
  const oos=p.stock===0;
  const pct=isOnSale?Math.round(((p.price-p.salePrice)/p.price)*100):0;
  const stars=Array.from({length:5},(_,i)=>`<svg class="star ${i<Math.round(p.averageRating)?'':'empty'}" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${i<Math.round(p.averageRating)?'currentColor':'none'}" stroke="currentColor" stroke-width="1.5"/></svg>`).join('');
  const pd=JSON.stringify({_id:p._id,name:p.name,brand:p.brand,sku:p.sku,price:p.salePrice&&p.salePrice<p.price?p.salePrice:p.price,stock:p.stock,images:p.images,slug:p.slug});
  return `<div class="product-card ${oos?'out-of-stock':''}">
    <a href="/pages/product.html?slug=${p.slug}" class="product-card-img">
      ${p.images?.[0]?.url?`<img src="${p.images[0].url}" alt="${p.name}" loading="lazy">`:`<div class="product-card-img-placeholder"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`}
      <div class="product-card-badges">${isOnSale?`<span class="badge badge-crimson">-${pct}%</span>`:''}</div>
    </a>
    <div class="product-card-body">
      <div class="product-card-brand">${p.brand}</div>
      <a href="/pages/product.html?slug=${p.slug}" class="product-card-name">${p.name}</a>
      ${p.sku?`<div class="product-card-compat">SKU: ${p.sku}</div>`:''}
      ${p.averageRating>0?`<div class="product-card-rating"><div class="stars">${stars}</div><span>(${p.reviewCount})</span></div>`:''}
    </div>
    <div class="product-card-footer">
      <div class="product-price">${isOnSale?`<span class="product-price-sale">${SAS.utils.formatPrice(p.salePrice)}</span><span class="product-price-original">${SAS.utils.formatPrice(p.price)}</span>`:`<span class="product-price-current">${SAS.utils.formatPrice(price)}</span>`}</div>
      <button class="product-card-add" onclick="event.preventDefault();SAS.cart.add(${pd.replace(/"/g,'&quot;')});syncCartDrawer()" ${oos?'disabled':''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  </div>`;
}

function renderPagination({page,pages}){
  const el=document.getElementById('paginationContainer');if(!el||pages<=1){if(el)el.innerHTML='';return;}
  let start=Math.max(1,page-2),end=Math.min(pages,start+4);if(end-start<4)start=Math.max(1,end-4);
  let h=`<button class="page-btn" onclick="loadProducts(${page-1})" ${page===1?'disabled':''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>`;
  if(start>1)h+=`<button class="page-btn" onclick="loadProducts(1)">1</button>${start>2?'<span style="padding:0 4px;color:var(--text-muted)">…</span>':''}`;
  for(let i=start;i<=end;i++)h+=`<button class="page-btn ${i===page?'active':''}" onclick="loadProducts(${i})">${i}</button>`;
  if(end<pages)h+=`${end<pages-1?'<span style="padding:0 4px;color:var(--text-muted)">…</span>':''}<button class="page-btn" onclick="loadProducts(${pages})">${pages}</button>`;
  h+=`<button class="page-btn" onclick="loadProducts(${page+1})" ${page===pages?'disabled':''}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>`;
  el.innerHTML=h;
}

function buildFilterSidebar(){
  const html=`
    <div class="filter-group">
      <div class="filter-group-header"><h4>Search</h4></div>
      <div style="position:relative"><input type="search" id="filterSearch" class="form-input" placeholder="Part name, SKU..." value="${shopState.filters.q||''}" style="padding-right:40px" onkeydown="if(event.key==='Enter')applyFilter('q',this.value)"><button onclick="applyFilter('q',document.getElementById('filterSearch').value)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--text-muted)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button></div>
    </div>
    <div class="filter-group">
      <div class="filter-group-header"><h4>Condition</h4></div>
      <div class="filter-options">
        ${['','new','used','refurbished'].map(c=>`<label class="filter-option"><input type="radio" name="condition" value="${c}" ${shopState.filters.condition===(c||undefined)?'checked':''} onchange="applyFilter('condition',this.value)"><span class="filter-option-label" style="text-transform:capitalize">${c||'All Conditions'}</span></label>`).join('')}
      </div>
    </div>
    <div class="filter-group">
      <div class="filter-group-header"><h4>Price Range</h4></div>
      <div class="price-range-inputs">
        <input type="number" id="minPrice" placeholder="Min $" value="${shopState.filters.minPrice||''}" min="0" onchange="applyPriceFilter()">
        <input type="number" id="maxPrice" placeholder="Max $" value="${shopState.filters.maxPrice||''}" min="0" onchange="applyPriceFilter()">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        ${[50,100,250,500,1000].map(v=>`<button onclick="setQuickPrice(${v})" style="padding:3px 10px;font-size:11px;border:1px solid var(--border);border-radius:var(--radius-full);background:var(--bg-elevated);color:var(--text-secondary);cursor:pointer;transition:all .15s" onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'">Under $${v}</button>`).join('')}
      </div>
    </div>
    <div class="filter-group">
      <div class="filter-group-header"><h4>Availability</h4></div>
      <label class="filter-option"><input type="checkbox" ${shopState.filters.inStock?'checked':''} onchange="applyFilter('inStock',this.checked?'true':'')"><span class="filter-option-label">In Stock Only</span></label>
    </div>
    <div class="filter-group">
      <div class="filter-group-header"><h4>Vehicle Brand</h4></div>
      <div class="filter-options">
        ${['','BMW','Toyota','Mercedes','Honda','Ford','Chevrolet','Nissan','Hyundai'].map(b=>`<label class="filter-option"><input type="radio" name="vbrand" value="${b}" ${(shopState.filters.brand||'')===(b)?'checked':''} onchange="applyFilter('brand',this.value)"><span class="filter-option-label">${b||'All Brands'}</span></label>`).join('')}
      </div>
    </div>`;
  const s=document.getElementById('filterSidebarContent'),d=document.getElementById('filterDrawerContent');
  if(s)s.innerHTML=html;if(d)d.innerHTML=html;
}

function applyFilter(key,value){
  if(!value){delete shopState.filters[key];}else{shopState.filters[key]=value;}
  loadProducts(1);buildFilterSidebar();updateActiveFilters();
}
function applyPriceFilter(){
  const min=document.querySelector('#minPrice')?.value,max=document.querySelector('#maxPrice')?.value;
  if(min)shopState.filters.minPrice=min;else delete shopState.filters.minPrice;
  if(max)shopState.filters.maxPrice=max;else delete shopState.filters.maxPrice;
  loadProducts(1);updateActiveFilters();
}
function setQuickPrice(max){shopState.filters.maxPrice=max;delete shopState.filters.minPrice;loadProducts(1);buildFilterSidebar();updateActiveFilters();}
function clearAllFilters(){shopState.filters={};const h=document.getElementById('headerSearchInput');if(h)h.value='';buildFilterSidebar();loadProducts(1);}
function applySearchFromHeader(){const q=document.getElementById('headerSearchInput')?.value?.trim();applyFilter('q',q);}

function updateActiveFilters(){
  const c=document.getElementById('activeFilters');if(!c)return;
  const labels={q:'Search',brand:'Brand',model:'Model',year:'Year',category:'Category',condition:'Condition',minPrice:'Min $',maxPrice:'Max $',inStock:'In Stock'};
  const tags=Object.entries(shopState.filters).filter(([,v])=>v).map(([k,v])=>`<span class="filter-tag">${labels[k]||k}: <strong>${v}</strong><button onclick="applyFilter('${k}','')"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></span>`);
  c.innerHTML=tags.join('');c.style.display=tags.length?'flex':'none';
  const b=document.getElementById('activeFilterCount');if(b){b.textContent=tags.length;b.style.display=tags.length?'inline-flex':'none';}
}

function updateShopTitle(){
  const t=document.getElementById('shopTitle');if(!t)return;
  if(shopState.filters.q)t.textContent=`Search: "${shopState.filters.q}"`;
  else if(shopState.filters.category)t.textContent=SAS.utils.slugToTitle(shopState.filters.category);
  else if(shopState.filters.brand)t.textContent=`${shopState.filters.brand} Parts`;
  else t.textContent='All Parts';
}

function setView(type){
  shopState.view=type;
  const grid=document.getElementById('productsGrid');
  document.getElementById('gridViewBtn')?.classList.toggle('active',type==='grid');
  document.getElementById('listViewBtn')?.classList.toggle('active',type==='list');
  grid?.classList.toggle('list-view',type==='list');
}

function syncCartDrawer(){
  SAS.cart.renderItems(document.getElementById('cartDrawerItems'));
  SAS.cart.renderSummary(document.getElementById('cartDrawerSummary'));
}

document.addEventListener('DOMContentLoaded',()=>{
  readParamsIntoState();buildFilterSidebar();loadProducts();
  document.getElementById('headerSearchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')applySearchFromHeader();});
  document.getElementById('sortSelect')?.addEventListener('change',()=>loadProducts(1));
  SAS.cart.on(()=>syncCartDrawer());syncCartDrawer();
});
