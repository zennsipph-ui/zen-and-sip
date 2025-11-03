/* ============================================================
   Zen & Sip — Shop (forced product images; PNG only)
   ============================================================ */

/* global SHOP_CONFIG */
const API    = window.SHOP_CONFIG?.API_URL;
const SECRET = window.SHOP_CONFIG?.SHARED_SECRET;

const MAX_UPLOAD_MB = 15;
const ALLOWED_MIME = new Set([
  "image/jpeg","image/png","image/webp","image/heic","application/pdf"
]);

/* ---------- Map product names -> exact PNG path ---------- */
function forceImagePath(name = "") {
  const n = String(name).trim().toLowerCase();   // trims trailing spaces
  if (n.includes("suizawa")) return "assets/product/suizawa.png";
  if (n.includes("okuunmo")) return "assets/product/okuunmo.png";
  // add more here when you have photos:
  // if (n.includes("yamabuki")) return "assets/product/yamabuki.png";
  return "assets/sample-product.jpg";
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
async function apiFetch(url, opts = {}) {
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

    // Force image_url per product (PNG paths above)
    state.products = (data.items || []).map(p => {
      const img = forceImagePath(p.name);
      return { ...p, image_url: img };
    });

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

    return `
      <div class="card" role="article" aria-label="${p.name}">
        <div class="media-square">
          <img class="product-image" loading="lazy" src="${p.image_url}" alt="${p.name}">
        </div>
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
          <img src="assets/qr-gcash.png" alt="GCash QR" style="width:100%;max-width:220px;border-radius:8px"/>
          <div class="muted">GCash</div>
        </div>
        <div class="card" style="flex:1;text-align:center">
          <img src="assets/qr-gotyme.jpg" alt="GoTyme QR" style="width:100%;max-width:220px;border-radius:8px"/>
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
