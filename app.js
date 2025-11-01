/* global SHOP_CONFIG */
const API    = window.SHOP_CONFIG?.API_URL;        // .../exec
const SECRET = window.SHOP_CONFIG?.SHARED_SECRET;  // zenNsipwillbebig1121

// ---------- State ----------
const state = {
  products: [],
  cart: new Map(),             // id -> {id,name,price,qty,stock,image_url}
  quote: null,                 // {subtotal, shipping_fee, total}
  tempReceiptId: null,         // file_id from uploadTempReceipt
  order: null
};

function $(q){ return document.querySelector(q); }
function currency(v){ return `₱${(Number(v)||0).toLocaleString()}`; }

// ---------- API helper (passes secret; tolerant to Apps Script errors) ----------
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

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', refresh);

// ---------- Products ----------
async function refresh(){
  $("#statusBadge") && ($("#statusBadge").textContent = "loading…");
  try{
    const data = await apiFetch(`${API}?action=products`);
    state.products = data.items || [];
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

  root.innerHTML = state.products.map(p => `
    <div class="card">
      <img src="${p.image_url || './assets/sample-product.jpg'}" alt="${p.name}" style="width:100%;height:180px;object-fit:cover;border-radius:10px"/>
      <h3 style="margin:8px 0 4px">${p.name}</h3>
      <div class="row wrap" style="justify-content:space-between">
        <div class="muted">Stock: ${p.stock} ${p.stock<=2?'<span class="badge">few left</span>':''}</div>
        <div class="price">${currency(p.price)}</div>
      </div>
      <div class="row" style="margin-top:8px">
        <input type="number" min="1" max="${p.stock}" value="1" id="qty-${p.id}">
        <button class="btn" onclick="addToCart('${p.id}')">Add</button>
      </div>
    </div>
  `).join("");

  updateCartCount();
  renderCheckoutPanel();
}

// ---------- Cart helpers ----------
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
function openCart(){ $("#checkoutPanel")?.scrollIntoView({behavior:'smooth'}); }

function toggleLalamoveUI(){
  const courier = $("#courier")?.value || "JNT";
  const regionWrap = $("#regionWrap");
  const note = $("#lalamoveNote");
  const isLala = courier === "LALAMOVE";

  if(regionWrap) regionWrap.style.display = isLala ? "none" : "";
  if(note)       note.style.display       = isLala ? "block" : "none";
}

// ---------- Checkout: single step (auto-quote) ----------
function renderCheckoutPanel(forceOpen=false){
  const root = $("#checkoutPanel");
  if(!root) return;

  const items = [...state.cart.values()];
  if(!items.length){
    state.quote = null; state.tempReceiptId = null;
    root.innerHTML = `<p class="muted">Add items to your cart to begin.</p>`;
    return;
  }

  // Preserve current inputs if they exist (so we don't wipe user typing)
  const prev = {
    name:   $("#name")?.value || "",
    email:  $("#email")?.value || "",
    address:$("#address")?.value || "",
    courier:$("#courier")?.value || "JNT",
    region: $("#regionGroup")?.value || "NCR"
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

      <!-- this will hide if Lalamove -->
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

    <!-- red notice for Lalamove -->
    <p id="lalamoveNote" class="muted"
      style="display:${prev.courier==='LALAMOVE'?'block':'none'}; 
              color:#ef4444; background:#2a0f12; 
              border:1px solid #ef444455; padding:8px; 
              border-radius:10px;">
      For Lalamove orders, please message us on IG (<strong>@zenandsip</strong>)
      with your exact address and preferred pickup time. Shipping will be quoted separately.
    </p>


    <div class="stack" style="margin-top:8px">
      <input id="name" placeholder="Full name" required value="${prev.name}">
      <input id="email" type="email" placeholder="Email" required value="${prev.email}">
      <textarea id="address" placeholder="Complete address" rows="2" required>${prev.address}</textarea>
    </div>

    <div class="summary">
      <div style="display:flex;justify-content:space-between">
        <span>Subtotal</span><strong id="qSub">${currency(getCartSubtotal())}</strong>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>Shipping</span><strong id="qShip">—</strong>
      </div>
      <div class="total">
        <span>Total</span><strong id="qTot">—</strong>
      </div>
    </div>

    <div class="stack" style="margin-top:10px">
      <div class="row wrap">
        <div class="card" style="flex:1;text-align:center">
          <img src="./assets/qr-gcash.png" alt="GCash QR" style="width:100%;max-width:220px;border-radius:8px"/>
          <div class="muted">GCash</div>
        </div>
        <div class="card" style="flex:1;text-align:center">
          <img src="./assets/qr-gotyme.jpg" alt="GoTyme QR" style="width:100%;max-width:220px;border-radius:8px"/>
          <div class="muted">GoTyme</div>
        </div>
      </div>

      <div class="row wrap">
        <input type="file" id="receiptFile" accept="image/*,application/pdf">
        <select id="paymentMethod">
          <option value="GCash">GCash</option>
          <option value="GoTyme">GoTyme</option>
        </select>
        <button class="btn" id="finalizeBtn" onclick="finalizeOrder()">Place Order</button>
      </div>
      <p class="muted">Upload your proof here and then tap “Place Order”. We’ll attach it automatically.</p>
    </div>
  `;

  $("#courier")?.addEventListener('change', refreshQuote);
  $("#regionGroup")?.addEventListener('change', refreshQuote);
  refreshQuote(); // initial compute

  if(forceOpen) root.scrollIntoView({behavior:'smooth'});
}

$("#courier")?.addEventListener('change', () => { toggleLalamoveUI(); refreshQuote(); });
$("#regionGroup")?.addEventListener('change', refreshQuote);
toggleLalamoveUI();    // set correct visibility on first render
refreshQuote();        // initial compute


// ---------- Quote (no write) ----------
async function refreshQuote(){
  const items = [...state.cart.values()].map(i=>({id:i.id, qty:i.qty}));
  if(!items.length){ 
    state.quote=null;
    $("#qSub")&&($("#qSub").textContent=currency(getCartSubtotal()));
    $("#qShip")&&($("#qShip").textContent='—');
    $("#qTot")&&($("#qTot").textContent='—');
    return;
  }

  const courier = $("#courier")?.value || 'JNT';
  const region  = $("#regionGroup")?.value || 'NCR';
  const isLala  = courier === 'LALAMOVE';

  try{
    // Lalamove requires a client-provided shipping fee.
    // We pass 0 for API consistency, but show "TBD" in the UI.
    const q = await apiFetch(`${API}?action=quote`, {
      method: 'POST',
      body: JSON.stringify({
        items,
        courier,
        region_group: region,
        shipping_fee: isLala ? 0 : null
      })
    });

    state.quote = q;
    $("#qSub")&&($("#qSub").textContent=currency(q.subtotal));

    if(isLala){
      $("#qShip")&&($("#qShip").textContent='TBD (Lalamove)');
      $("#qTot")&&($("#qTot").textContent=currency(q.subtotal)); // total without shipping
    }else{
      $("#qShip")&&($("#qShip").textContent=currency(q.shipping_fee));
      $("#qTot")&&($("#qTot").textContent=currency(q.total));
    }
  }catch(err){
    console.error(err);
    $("#qSub")&&($("#qSub").textContent=currency(getCartSubtotal()));
    $("#qShip")&&($("#qShip").textContent='—');
    $("#qTot")&&($("#qTot").textContent='—');
    state.quote=null;
  }
}


// ---------- Receipt upload (pre-order) ----------
async function sendReceipt(){
  const file = document.getElementById('receiptFile')?.files?.[0];
  if(!file){ alert("Choose a file first."); return; }
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;

  const b64 = await fileToBase64(file);
  try{
    const up = await apiFetch(`${API}?action=uploadTempReceipt`, {
      method: 'POST',
      body: JSON.stringify({ base64:String(b64).split(',')[1], mimeType:file.type||'image/png', filename:file.name })
    });
    state.tempReceiptId = up.file_id;
    renderCheckoutPanel(); // re-render to enable Place Order
    alert("Receipt uploaded. You can now place your order.");
  }catch(err){
    alert("Upload failed: " + err.message);
  }finally{
    btn.disabled = false;
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

// ---------- Finalize order (writes to Sheet) ----------
async function finalizeOrder(){
  const buyer = {
    name: $("#name")?.value?.trim(),
    email: $("#email")?.value?.trim(),
    address: $("#address")?.value?.trim()
  };
  if(!buyer.name || !buyer.email || !buyer.address){
    alert("Please fill in your name, email, and address.");
    return;
  }

  const file = document.getElementById('receiptFile')?.files?.[0];
  if(!file){ alert("Please attach a receipt/proof of payment."); return; }

  const items = [...state.cart.values()].map(i=>({id:i.id, qty:i.qty}));
  if(!items.length){ alert("Your cart is empty."); return; }

  const courier = $("#courier").value;
  const region  = $("#regionGroup").value;
  const payment_method = $("#paymentMethod").value;
  const shipping_fee = (courier==='LALAMOVE') ? 0 : null;

  const btn = $("#finalizeBtn");
  btn.disabled = true; btn.textContent = "Placing…";

  try{
    // 1) Upload receipt quietly
    const b64 = await new Promise((resolve,reject)=>{
      const r = new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
    });
    const up = await apiFetch(`${API}?action=uploadTempReceipt`, {
      method: 'POST',
      body: JSON.stringify({
        base64: String(b64).split(',')[1],
        mimeType: file.type || 'image/png',
        filename: file.name
      })
    });

    // 2) Finalize order with the returned file_id
    const res = await apiFetch(`${API}?action=finalizeOrder`, {
      method: 'POST',
      body: JSON.stringify({
        items, buyer, payment_method,
        courier, region_group: region,
        shipping_fee,
        receipt_file_id: up.file_id
      })
    });

    state.order = {
      order_id: res.order_id,
      subtotal: Number(res.subtotal||0),
      shipping_fee: Number(res.shipping_fee||0),
      total: Number(res.total||0),
      courier, region_group: region
    };
    alert(`Order placed! ID: ${state.order.order_id}`);
  }catch(err){
    alert("Order failed: " + err.message);
  }finally{
    btn.disabled = false; btn.textContent = "Place Order";
  }
}


// ---------- Optional tracker ----------
async function trackOrder(orderId){
  return apiFetch(`${API}?action=track&order_id=${encodeURIComponent(orderId)}`);
}
