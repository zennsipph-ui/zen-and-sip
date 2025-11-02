<<<<<<< HEAD
/* ===========================
   Zen & Sip — UI Theme (mobile-first)
   =========================== */

:root{
  /* Updated Palette inspired by the Earthy Green/Matcha image 
    All colors checked for WCAG AA contrast against main --bg and --text
  */
  --bg: #0b0f12;           /* Primary Background (Dark) */
  --surface: #12181c;      /* Main Surface/Card Background */
  --surface-2: #192127;    /* Secondary Surface (Slightly lighter dark) */
  --muted: #A3ADB8;        /* Muted Text (Improved readability from original #8b98a5) */
  --text: #e7edf2;         /* Primary Text (Light) */

  --accent: #528A6D;       /* Earthy/Matcha Green (Primary action color - Cypress/Moss blend) */
  --accent-text: #E7EDF2;  /* Light text color for the accent button */
  --accent-2: #38BDFC;     /* Brighter Cyan/Blue (Secondary action/info color) */
  --danger: #ef4444;

  /* radii and spacing */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;
  --pad: 12px;
  --gap: 12px;

  /* sizing */
  --tap: 44px;             /* minimum tap target */
  --shadow: 0 6px 20px rgba(0,0,0,.30);
  --shadow-soft: 0 4px 12px rgba(0,0,0,.22);
}

/* base */
*{ box-sizing: border-box; }
html, body{ height:100%; }
body{
  margin:0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
  line-height: 1.45;
}

img{ max-width:100%; display:block; }

.container{
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

/* header / topbar */
.header,.topbar{
  display:flex;
  justify-content: space-between;
  align-items:center;
  gap: 10px;
  margin-bottom: 12px;
}

.logo{
  display:flex; align-items:center; gap:10px;
  font-weight: 800;
}
.logo img{ width:28px; height:28px; border-radius: 6px; }

.badge{
  /* Use accent color for status badge */
  background: rgba(82,138,109,.12); /* Based on new --accent */
  color: #a2cdb3; 
  border: 1px solid rgba(82,138,109,.35);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}

/* buttons */
button,.btn{
  appearance:none;
  border:none;
  border-radius: var(--r-md);
  padding: 10px 14px;
  background: var(--accent);
  color:var(--accent-text); 
  font-weight:700;
  cursor:pointer;
  transition: transform .06s ease, filter .2s ease, background .2s ease;
  min-height: var(--tap); 
  line-height: 1.2; 
}
button:hover{ filter: brightness(1.1); } 
button:active{ transform: translateY(1px) scale(.99); }

button.secondary{ background: var(--accent-2); color: #04202b; }
button.ghost{ background: var(--surface-2); color: var(--text); }
button.danger{ background: var(--danger); color:#fff; }

/* inputs */
input, select, textarea{
  width:100%;
  min-height: var(--tap);
  padding: 10px 12px;
  border: 1px solid #253038;
  border-radius: var(--r-md);
  background: #0f1519;
  color: var(--text);
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
}
input:focus, select:focus, textarea:focus{
  border-color: rgba(82,138,109,.55); 
  box-shadow: 0 0 0 3px rgba(82,138,109,.15);
}

/* layout */
.layout{
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap);
}
@media (min-width: 900px){
  .layout{
    grid-template-columns: 1fr 360px;
  }
}

.grid{
  display:grid;
  grid-template-columns: 1fr; 
  gap: var(--gap);
}
/* Product Card Sizing: Set max two large columns for shop page */
@media (min-width: 560px){
  .grid.product-list { 
    grid-template-columns: repeat(2, 1fr); 
  }
}
@media (min-width: 900px){
  .grid.product-list {
    grid-template-columns: repeat(2, 1fr); 
  }
}


/* cards */
.card{
  background: var(--surface);
  border: 1px solid #1a2329;
  border-radius: var(--r-lg);
  padding: var(--pad);
  box-shadow: var(--shadow-soft);
}
.card:hover{ box-shadow: var(--shadow); }

/* Product image = actual <img> element */
.product-image {
  display: block;
  width: 100%;
  height: auto !important;   /* override any inline height */
  aspect-ratio: 1 / 1;       /* perfect square */
  object-fit: cover;         /* neat crop */
  border-radius: var(--r-md);
  border: 1px solid #1a2329;
  background: #0f1519;
  box-shadow: 0 4px 14px rgba(0,0,0,.25);
  transition: transform .2s ease, box-shadow .2s ease;
}
.product-image:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 18px rgba(82,138,109,.35);
}

/* (Optional utility if you ever wrap an img) */
.media-square{
  position:relative;
  aspect-ratio: 1 / 1;
  overflow:hidden;
  border-radius: var(--r-md);
  border: 1px solid #1a2329;
  background:#0f1519;
}
.media-square > img{
  position:absolute; inset:0;
  width:100%; height:100%;
  object-fit:cover;
  border-radius: inherit;
}



/* product row */
.product-meta{
  display:flex; justify-content:space-between; align-items:center; gap:8px;
  margin: 6px 0 2px;
}
.price{ font-weight: 800; }

.qty-row{
  display:flex; gap:8px; align-items:center;
}
.qty-row input[type="number"]{
  width: 90px; text-align:center;
  min-height: 44px; 
}

/* checkout sidebar */
.sidebar{ position: sticky; top: var(--pad); } 
@media (max-width: 899px){
  .sidebar{ position: static; }
}

.stack{ display:grid; gap: 10px; }
.row{ display:flex; gap: 8px; align-items:center; }
.row.wrap{ flex-wrap: wrap; }

.summary{
  border-top: 1px dashed #263139;
  padding-top: 10px;
  display:grid; gap: 6px;
}
.total{ display:flex; justify-content:space-between; font-weight:800; font-size: 1.05rem; }

/* cart badge */
.cartBadge{
  background: var(--accent-2);
  color:#001017;
  border-radius: 999px;
  padding: 2px 8px;
  font-weight: 800;
  margin-left: 6px;
  font-size: 12px;
}

/* labels & helpers */
.muted{ color: var(--muted); }

/* utility */
.center{ text-align:center; }
.hidden{ display:none !important; }

/* --- Pop Logo Effect --- */
.pop-logo img{
  width:48px;
  height:48px;
  border-radius:12px;
  /* Use new accent color for shadow effect */
  background: radial-gradient(circle at 40% 35%, #528A6D55, transparent 60%); 
  box-shadow:
    0 0 0 2px rgba(82,138,109,.25),
    0 0 16px rgba(82,138,109,.35),
    0 0 32px rgba(14,165,233,.2);
  transition: transform .25s ease, box-shadow .25s ease;
}
.pop-logo img:hover{
  transform: scale(1.08);
  box-shadow:
    0 0 0 3px rgba(82,138,109,.4),
    0 0 24px rgba(82,138,109,.55),
    0 0 48px rgba(14,165,233,.4);
}

/* Inline message under forms */
.msg {
  margin-top: 6px;
  font-size: 14px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.msg.error { color:#ef4444; background:#2a0f12; border-color:#ef444444; }
.msg.success { color:#10b981; background:#0c2a1f; border-color:#10b98144; }

/* Toast (mobile-friendly) */
.toast {
  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
  max-width: 92vw; padding: 10px 14px; border-radius: 12px;
  background: #111c21; color: #e7edf2; border:1px solid #263139;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  z-index: 9999; opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(-4px); pointer-events: auto; }
.toast.success { border-color:#10b98155; box-shadow: 0 8px 24px rgba(16,185,129,.15); }
.toast.error   { border-color:#ef444455; box-shadow: 0 8px 24px rgba(239,68,68,.15); }
=======
/* ============================================================
   Zen & Sip — Shop (absolute image paths; PNG only)
   ============================================================ */

/* global SHOP_CONFIG */
const API    = window.SHOP_CONFIG?.API_URL;
const SECRET = window.SHOP_CONFIG?.SHARED_SECRET;

const MAX_UPLOAD_MB = 15;
const ALLOWED_MIME = new Set([
  "image/jpeg","image/png","image/webp","image/heic","application/pdf"
]);

/* ---------- Build an absolute URL from a project-relative path ---------- */
function abs(path){
  // base like: http://127.0.0.1:5500/zen-and-sip-starter-shop/
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  return new URL(path.replace(/^\.?\//, ""), base).href;
}

/* ---------- Map product names -> exact PNG path (then absolutize) ---------- */
function imageUrlFor(name = ""){
  const n = String(name).trim().toLowerCase();

  if (n.includes("suizawa")) return abs("assets/product/suizawa.png");
  if (n.includes("okuunmo")) return abs("assets/product/okuunmo.png");
  // add more when ready:
  // if (n.includes("yamabuki")) return abs("assets/product/yamabuki.png");

  return abs("assets/sample-product.jpg");
}

/* ---------- State ---------- */
const state = {
  products: [],
  cart: new Map(),
  quote: null,
  tempReceiptId: null,
  tempReceiptName: null,
  order: null
};

function $(q){ return document.querySelector(q); }
function currency(v){ return `₱${(Number(v)||0).toLocaleString()}`; }

/* ---------- API helper ---------- */
async function apiFetch(url, opts = {}){
  const joiner = url.includes("?") ? "&" : "?";
  const withSecret = `${url}${joiner}secret=${encodeURIComponent(SECRET)}`;

  const isPost = String(opts.method||"").toUpperCase() === "POST";
  const headers = Object.assign(isPost ? { "Content-Type": "text/plain" } : {}, opts.headers || {});
  const res = await fetch(withSecret, { ...opts, headers });
  const text = await res.text();

  let data; try { data = JSON.parse(text); } catch { throw new Error("Bad JSON: " + text); }
  if (data.error) throw new Error(data.error);
  return data;
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", refresh);

/* ---------- Products ---------- */
async function refresh(){
  $("#statusBadge") && ($("#statusBadge").textContent = "loading…");
  try{
    const data = await apiFetch(`${API}?action=products`);

    // Force absolute image_url for each product
    state.products = (data.items || []).map(p => ({
      ...p,
      name: String(p.name || "").trim(), // trims trailing spaces from sheet
      image_url: imageUrlFor(p.name)
    }));

    renderCatalog();
    $("#statusBadge") && ($("#statusBadge").textContent = `loaded ${state.products.length}`);
  }catch(err){
    console.error("Products error:", err);
    $("#statusBadge") && ($("#statusBadge").textContent = "error");
    $("#catalog") && ($("#catalog").innerHTML = `<p class="muted">Failed to load products: ${err.message}</p>`);
  }
}

function renderCatalog(){
  const root = $("#catalog");
  if(!root) return;

  if(!state.products.length){
    root.innerHTML = `<p class="muted">No active products.</p>`;
    renderCheckoutPanel();
    return;
  }

  root.innerHTML = state.products.map(p => {
    const lowStock = Number(p.stock) <= 2;
    const img = p.image_url;

    return `
      <div class="card" role="article" aria-label="${p.name}">
        <img
          class="product-image"
          loading="lazy"
          src="${img}"
          alt="${p.name}"
          style="display:block;width:100%;height:180px;object-fit:cover;border-radius:10px"
          onerror="this.onerror=null;this.src='${abs("assets/sample-product.jpg")}';"
        />
        <h3 style="margin:8px 0 4px">${p.name}</h3>

        <div class="row wrap" style="justify-content:space-between">
          <div class="muted">
            Stock: ${p.stock}
            ${lowStock ? '<span class="badge" style="margin-left:6px">few left</span>' : ''}
          </div>
          <div class="price">${currency(p.price)}</div>
        </div>

        <div class="row" style="margin-top:8px">
          <input type="number" min="1" max="${p.stock}" value="1" id="qty-${p.id}" aria-label="Quantity for ${p.name}">
          <button class="btn" onclick="addToCart('${p.id}')" aria-label="Add ${p.name} to cart">Add</button>
        </div>
      </div>
    `;
  }).join("");

  updateCartCount();
  renderCheckoutPanel();
}

/* ---------- Cart ---------- */
function addToCart(id){
  const product = state.products.find(x=>String(x.id)===String(id));
  if(!product) return;
  const qty = Number(document.getElementById(`qty-${id}`)?.value || 1);
  if(qty<1){ alert("Invalid quantity"); return; }
  if(qty>product.stock){ alert("Not enough stock."); return; }

  const curr = state.cart.get(id) || {...product, qty:0};
  curr.qty = Math.min(curr.qty + qty, product.stock);
  state.cart.set(id, curr);

  updateCartCount();
  renderCheckoutPanel(true);
}
function changeQty(id, delta){
  const curr = state.cart.get(id);
  if(!curr) return;
  const next = Math.max(0, Math.min(curr.qty + delta, curr.stock));
  if(next===0) state.cart.delete(id); else curr.qty = next;
  renderCheckoutPanel();
  updateCartCount();
}
function setQty(id, v){
  const curr = state.cart.get(id);
  if(!curr) return;
  let n = Number(v||0); if(Number.isNaN(n)) n = 0;
  n = Math.max(0, Math.min(n, curr.stock));
  if(n===0) state.cart.delete(id); else curr.qty = n;
  renderCheckoutPanel();
  updateCartCount();
}
function updateCartCount(){
  const count = [...state.cart.values()].reduce((a,c)=>a+c.qty,0);
  $("#cartCount") && ($("#cartCount").textContent = count);
}
function getCartSubtotal(){
  return [...state.cart.values()].reduce((a,c)=>a + c.price*c.qty,0);
}
function openCart(){ $("#checkoutPanel")?.scrollIntoView({behavior:"smooth"}); }

/* ---------- Checkout (auto-quote) ---------- */
function toggleLalamoveUI(){
  const courier = $("#courier")?.value || "JNT";
  const regionWrap = $("#regionWrap");
  const note = $("#lalamoveNote");
  const isLala = courier === "LALAMOVE";
  if(regionWrap) regionWrap.style.display = isLala ? "none" : "";
  if(note)       note.style.display       = isLala ? "block" : "none";
}
function renderCheckoutPanel(forceOpen=false){
  const root = $("#checkoutPanel");
  if(!root) return;

  const items = [...state.cart.values()];
  if(!items.length){
    state.quote = null; state.tempReceiptId = null; state.tempReceiptName = null;
    root.innerHTML = `<p class="muted">Add items to your cart to begin.</p>`;
    return;
  }

  const prev = {
    name:    $("#name")?.value || "",
    email:   $("#email")?.value || "",
    address: $("#address")?.value || "",
    contact: $("#contact")?.value || "",
    courier: $("#courier")?.value || "JNT",
    region:  $("#regionGroup")?.value || "NCR"
  };

  const cartLines = items.map(i=>`
    <li style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div>${i.name} <span class="muted">× ${i.qty}</span></div>
        <strong>${currency(i.price*i.qty)}</strong>
      </div>
      <div class="row" style="margin-top:4px">
        <button class="btn ghost" onclick="changeQty('${i.id}',-1)">-</button>
        <input style="width:70px;text-align:center" type="number" min="0" max="${i.stock}" value="${i.qty}" onchange="setQty('${i.id}', this.value)">
        <button class="btn ghost" onclick="changeQty('${i.id}',1)">+</button>
        <div class="muted" style="margin-left:auto">left: ${i.stock}</div>
      </div>
    </li>
  `).join("");

  root.innerHTML = `
    <ul style="padding-left:18px;margin:0">${cartLines}</ul>

    <div class="row wrap" style="margin-top:10px">
      <select id="courier">
        <option value="JNT" ${prev.courier==='JNT'?'selected':''}>J&amp;T</option>
        <option value="LALAMOVE" ${prev.courier==='LALAMOVE'?'selected':''}>Lalamove</option>
      </select>
      <span id="regionWrap" style="flex:1; ${prev.courier==='LALAMOVE'?'display:none;':''}">
        <select id="regionGroup">
          <option value="NCR" ${prev.region==='NCR'?'selected':''}>NCR</option>
          <option value="LUZON" ${prev.region==='LUZON'?'selected':''}>Luzon</option>
          <option value="VISAYAS" ${prev.region==='VISAYAS'?'selected':''}>Visayas</option>
          <option value="MINDANAO" ${prev.region==='MINDANAO'?'selected':''}>Mindanao</option>
          <option value="ISLAND" ${prev.region==='ISLAND'?'selected':''}>Island</option>
        </select>
      </span>
    </div>

    <p id="lalamoveNote" class="muted"
      style="display:${prev.courier==='LALAMOVE'?'block':'none'}; color:#ef4444; background:#2a0f12; border:1px solid #ef444455; padding:8px; border-radius:10px;">
      For Lalamove orders, please message us on IG (<strong>@zenandsip</strong>) with your exact address and preferred pickup time. Shipping will be quoted separately.
    </p>

    <div class="stack" style="margin-top:8px">
      <input id="name" placeholder="Full name" value="${prev.name}">
      <input id="email" type="email" placeholder="Email" value="${prev.email}">
      <textarea id="address" placeholder="Complete address" rows="2">${prev.address}</textarea>
      <input id="contact" placeholder="Contact number" value="${prev.contact}">
    </div>

    <div class="summary">
      <div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong id="qSub">${currency(getCartSubtotal())}</strong></div>
      <div style="display:flex;justify-content:space-between"><span>Shipping</span><strong id="qShip">—</strong></div>
      <div class="total"><span>Total</span><strong id="qTot">—</strong></div>
    </div>

    <div class="stack" style="margin-top:10px">
      <div class="row wrap">
        <div class="card" style="flex:1;text-align:center">
          <img src="${abs("assets/qr-gcash.png")}" alt="GCash QR" style="width:100%;max-width:220px;border-radius:8px"/>
          <div class="muted">GCash</div>
        </div>
        <div class="card" style="flex:1;text-align:center">
          <img src="${abs("assets/qr-gotyme.jpg")}" alt="GoTyme QR" style="width:100%;max-width:220px;border-radius:8px"/>
          <div class="muted">GoTyme</div>
        </div>
      </div>

      <div class="row wrap">
        <input type="file" id="receiptFile" accept="image/*,application/pdf">
        <p id="formMsg" class="msg" style="display:none"></p>
        <select id="paymentMethod">
          <option value="GCash">GCash</option>
          <option value="GoTyme">GoTyme</option>
        </select>
        <button class="btn" id="finalizeBtn" onclick="finalizeOrder()">Place Order</button>
      </div>
      <p class="muted">Choose your receipt file — it will auto-upload. <span id="receiptStatus" class="muted"></span></p>
    </div>
  `;

  $("#courier")?.addEventListener("change", () => { toggleLalamoveUI(); refreshQuote(); });
  $("#regionGroup")?.addEventListener("change", refreshQuote);
  $("#receiptFile")?.addEventListener("change", autoUploadReceipt);

  toggleLalamoveUI();
  refreshQuote();

  if(forceOpen) root.scrollIntoView({behavior:"smooth"});
}

/* ---------- Quote ---------- */
async function refreshQuote(){
  const items = [...state.cart.values()].map(i=>({id:i.id, qty:i.qty}));
  if(!items.length){
    state.quote=null;
    $("#qSub")&&($("#qSub").textContent=currency(getCartSubtotal()));
    $("#qShip")&&($("#qShip").textContent="—");
    $("#qTot")&&($("#qTot").textContent="—");
    return;
  }

  const courier = $("#courier")?.value || "JNT";
  const region  = $("#regionGroup")?.value || "NCR";
  const isLala  = courier === "LALAMOVE";

  try{
    const q = await apiFetch(`${API}?action=quote`, {
      method: "POST",
      body: JSON.stringify({ items, courier, region_group: region, shipping_fee: isLala ? 0 : null })
    });

    state.quote = q;
    $("#qSub")&&($("#qSub").textContent=currency(q.subtotal));
    if(isLala){
      $("#qShip")&&($("#qShip").textContent="TBD (Lalamove)");
      $("#qTot")&&($("#qTot").textContent=currency(q.subtotal));
    }else{
      $("#qShip")&&($("#qShip").textContent=currency(q.shipping_fee));
      $("#qTot")&&($("#qTot").textContent=currency(q.total));
    }
  }catch(err){
    console.error(err);
    $("#qSub")&&($("#qSub").textContent=currency(getCartSubtotal()));
    $("#qShip")&&($("#qShip").textContent="—");
    $("#qTot")&&($("#qTot").textContent="—");
    state.quote=null;
  }
}

/* ---------- Upload ---------- */
async function autoUploadReceipt(){
  const f = $("#receiptFile")?.files?.[0];
  const status = $("#receiptStatus");
  if(!f){
    state.tempReceiptId=null; state.tempReceiptName=null;
    inlineMsg("", "info");
    if(status) status.textContent="";
    return;
  }

  const sizeMB = f.size / (1024*1024);
  if(sizeMB > MAX_UPLOAD_MB){ inlineMsg(`File too large (max ${MAX_UPLOAD_MB} MB).`, "error"); $("#receiptFile").value=""; return; }
  if(!ALLOWED_MIME.has(f.type)){ inlineMsg(`Unsupported file type (${f.type || "unknown"}).`, "error"); $("#receiptFile").value=""; return; }

  inlineMsg("Uploading receipt…", "info");
  status && (status.textContent = " (uploading…)");

  try{
    const b64 = await fileToBase64(f);
    const up = await apiFetch(`${API}?action=uploadTempReceipt`, {
      method: "POST",
      body: JSON.stringify({ base64: String(b64).split(",")[1], mimeType: f.type || "image/png", filename: f.name })
    });
    state.tempReceiptId   = up.file_id;
    state.tempReceiptName = f.name;
    inlineMsg("Receipt uploaded ✔", "success");
    status && (status.textContent = ` (uploaded: ${f.name})`);
  }catch(err){
    console.error(err);
    inlineMsg("Upload failed: " + err.message, "error");
    status && (status.textContent = "");
    state.tempReceiptId=null; state.tempReceiptName=null;
  }
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = ()=>resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ---------- Finalize order ---------- */
async function finalizeOrder(){
  const buyer = {
    name: $("#name")?.value?.trim(),
    email: $("#email")?.value?.trim(),
    address: $("#address")?.value?.trim(),
    contact: $("#contact")?.value?.trim() || ""
  };

  if(!buyer.name || !buyer.email || !buyer.address || !buyer.contact){
    alert("Please fill in your name, email, address, and contact number.");
    return;
  }

  const fileField = document.getElementById("receiptFile");
  const file = fileField?.files?.[0];
  if(!file && !state.tempReceiptId){
    alert("Please attach a receipt/proof of payment.");
    return;
  }

  const items = [...state.cart.values()].map(i=>({id:i.id, qty:i.qty}));
  if(!items.length){ alert("Your cart is empty."); return; }

  const courier = $("#courier").value;
  const region  = $("#regionGroup").value;
  const payment_method = $("#paymentMethod").value;
  const shipping_fee = (courier==="LALAMOVE") ? 0 : null;

  const btn = $("#finalizeBtn");
  btn.disabled = true; btn.textContent = "Placing…";
  inlineMsg("", "info");

  try{
    let receiptFileId = state.tempReceiptId;
    if(!receiptFileId && file){
      const b64 = await fileToBase64(file);
      const up = await apiFetch(`${API}?action=uploadTempReceipt`, {
        method: "POST",
        body: JSON.stringify({ base64: String(b64).split(",")[1], mimeType: file.type || "image/png", filename: file.name })
      });
      receiptFileId = up.file_id;
    }

    const res = await apiFetch(`${API}?action=finalizeOrder`, {
      method: "POST",
      body: JSON.stringify({ items, buyer, payment_method, courier, region_group: region, shipping_fee, receipt_file_id: receiptFileId })
    });

    state.order = {
      order_id: res.order_id,
      subtotal: Number(res.subtotal||0),
      shipping_fee: Number(res.shipping_fee||0),
      total: Number(res.total||0),
      courier, region_group: region
    };

    const linkText = res.receipt_file_link ? `\nReceipt: ${res.receipt_file_link}` : "";
    alert(`Order placed! ID: ${state.order.order_id}${linkText}`);

    state.cart.clear();
    state.quote = null;
    state.tempReceiptId = null;
    state.tempReceiptName = null;
    if (fileField) fileField.value = "";
    renderCheckoutPanel();
  }catch(err){
    console.error(err);
    inlineMsg("Order failed: " + err.message, "error");
    alert("Order failed: " + err.message);
  }finally{
    btn.disabled = false; btn.textContent = "Place Order";
  }
}

/* ---------- Misc ---------- */
async function trackOrder(orderId){
  return apiFetch(`${API}?action=track&order_id=${encodeURIComponent(orderId)}`);
}
function inlineMsg(text, type="error", id="formMsg"){
  const el = document.getElementById(id);
  if(!el) return;
  el.className = `msg ${type}`;
  el.textContent = text || "";
  el.style.display = text ? "block" : "none";
  if(text) el.scrollIntoView({behavior:"smooth", block:"nearest"});
}
let toastTimer;
function toast(text, type="success"){
  const el = document.getElementById("toast"); if(!el) return;
  el.textContent = text || "";
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.className = "toast"; }, 2800);
}
>>>>>>> 3aa03f6 (MAJOR UPDATE)
