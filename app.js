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

const bulkState = {
  items: []
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

function renderCatalog() {
  const root = $("#catalog");
  if (!root) return;

  if (!state.products.length) {
    root.innerHTML = `<p class="muted">No active products.</p>`;
    return;
  }

  root.innerHTML = state.products.map(p => {
    const isSoldOut = Number(p.stock) <= 0;
    const lowStock = !isSoldOut && Number(p.stock) <= 2;

    return `
      <div class="product-card" role="article" aria-label="${p.name}">
        
        <img class="product-card-image ${isSoldOut ? "grayscale" : ""}"
             src="${p.image_url}"
             alt="${p.name}"
             onclick="openProductModal('${p.id}')">

        <div class="product-card-body">

          <h3 class="product-card-title">${p.name}</h3>

          <div class="product-card-meta">
            <span class="product-card-price">${currency(p.price)}</span>
            <span class="product-card-stock ${isSoldOut ? "sold" : lowStock ? "low" : ""}">
              ${isSoldOut ? "Sold Out" : `Stock: ${p.stock}`}
            </span>
          </div>

          <div class="product-card-actions">
            ${
              isSoldOut
                ? `<button class="btn" disabled>Unavailable</button>`
                : `
                <input type="number" min="1" max="${p.stock}" value="1" id="qty-${p.id}">
                <button class="btn primary" onclick="addToCart('${p.id}')">Add</button>
              `
            }
          </div>

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
  const regionWrap   = $("#regionWrap");
  const note         = $("#lalamoveNote");
  const addressBlock = $("#addressBlock");
  const contactBlock = $("#contactBlock");

  const isLala = courier === "LALAMOVE";

  // Region + note
  if (regionWrap) regionWrap.style.display = isLala ? "none" : "";
  if (note)       note.style.display       = isLala ? "block" : "none";

  // Address + contact hide/show
  if (addressBlock) addressBlock.style.display = isLala ? "none" : "";
  if (contactBlock) contactBlock.style.display = isLala ? "none" : "";
}

function renderCheckoutPanel(forceOpen = false) {
  const root = $("#checkoutPanel");
  if (!root) return;

  const items = [...state.cart.values()];
  if (!items.length) {
    state.quote = null;
    state.tempReceiptId = null;
    state.tempReceiptName = null;
    root.innerHTML = `<p class="muted">Add items to your cart to begin.</p>`;
    return;
  }

  const prev = {
    name: $("#name")?.value || "",
    email: $("#email")?.value || "",
    address: $("#address")?.value || "",
    contact: $("#contact")?.value || "",
    courier: $("#courier")?.value || "JNT",
    region: $("#regionGroup")?.value || "NCR"
  };

  const cartLines = items.map(i => `
    <li class="mini-cart-line">
      <div class="mini-cart-header">
        <span class="mini-cart-title">${i.name}</span>
        <span class="mini-cart-price">${currency(i.price * i.qty)}</span>
      </div>
      <div class="mini-cart-controls">
        <button class="btn ghost btn-qty" onclick="changeQty('${i.id}', -1)">-</button>
        <input
          class="mini-cart-input"
          type="number"
          min="0"
          max="${i.stock}"
          value="${i.qty}"
          onchange="setQty('${i.id}', this.value)"
        />
        <button class="btn ghost btn-qty" onclick="changeQty('${i.id}', 1)">+</button>
        <span class="mini-cart-left muted">left: ${i.stock}</span>
      </div>
    </li>
  `).join("");

    root.innerHTML = `
    <ul class="mini-cart-list">
      ${cartLines}
    </ul>

    <div class="row wrap" style="margin-top:10px">
      <select id="courier">
        <option value="JNT" ${prev.courier === 'JNT' ? 'selected' : ''}>J&amp;T</option>
        <option value="LALAMOVE" ${prev.courier === 'LALAMOVE' ? 'selected' : ''}>Lalamove</option>
      </select>
      <span id="regionWrap" style="flex:1; ${prev.courier === 'LALAMOVE' ? 'display:none;' : ''}">
        <select id="regionGroup">
          <option value="NCR" ${prev.region === 'NCR' ? 'selected' : ''}>NCR</option>
          <option value="LUZON" ${prev.region === 'LUZON' ? 'selected' : ''}>Luzon</option>
          <option value="VISAYAS" ${prev.region === 'VISAYAS' ? 'selected' : ''}>Visayas</option>
          <option value="MINDANAO" ${prev.region === 'MINDANAO' ? 'selected' : ''}>Mindanao</option>
          <option value="ISLAND" ${prev.region === 'ISLAND' ? 'selected' : ''}>Island</option>
        </select>
      </span>
    </div>

    <p id="lalamoveNote" class="muted"
      style="display:${prev.courier === 'LALAMOVE' ? 'block' : 'none'}; color:#ef4444; background:#2a0f12; border:1px solid #ef444455; padding:8px; border-radius:10px; margin-top:8px;">
      For Lalamove orders, kindly check the email for the pickup address and instructions. Please be sure to message us on Instagram (<strong>@zennsip.ph</strong>) before proceeding with the pickup.
    </p>

    <div class="stack" style="margin-top:8px">
      <input id="name" placeholder="Full name" value="${prev.name}">
      <input id="email" type="email" placeholder="Email" value="${prev.email}">
      <div id="addressBlock">
        <textarea id="address" placeholder="Complete address" rows="2">${prev.address}</textarea>
      </div>
      <div id="contactBlock">
        <input id="contact" placeholder="Contact number" value="${prev.contact}">
      </div>
    </div>

    <table class="summary-table">
      <tr>
        <td>Subtotal</td>
        <td id="qSub">${currency(getCartSubtotal())}</td>
      </tr>
      <tr>
        <td>Shipping</td>
        <td id="qShip">—</td>
      </tr>
      <tr class="total">
        <td>Total</td>
        <td id="qTot">—</td>
      </tr>
    </table>

        <div class="checkout-pay">

      <!-- 1. Payment method dropdown on top -->
      <div class="pay-method">
        <select id="paymentMethod">
          <option value="GCash">GCash</option>
          <option value="GoTyme">GoTyme</option>
        </select>
      </div>

      <!-- 2. QR codes side-by-side -->
      <div class="row wrap pay-qrs">
        <div class="card payment-card">
          <img src="assets/qr-gcash.png" alt="GCash QR" class="payment-qr"/>
          <div class="muted">GCash</div>
        </div>
        <div class="card payment-card">
          <img src="assets/qr-gotyme.JPG" alt="GoTyme QR" class="payment-qr"/>
          <div class="muted">GoTyme</div>
        </div>
      </div>

      <!-- 3. File upload -->
      <div class="pay-file">
        <input type="file" id="receiptFile" accept="image/*,application/pdf">
        <p id="formMsg" class="msg" style="display:none"></p>
      </div>

      <!-- 4. Place Order button at the bottom -->
      <button class="btn primary full pay-submit" id="finalizeBtn" onclick="finalizeOrder()">
        Place Order
      </button>

      <p class="muted small-note">
        Choose your receipt file — it will auto-upload. <span id="receiptStatus" class="muted"></span>
      </p>
    </div>
  `;


  $("#courier")?.addEventListener("change", () => {
    toggleLalamoveUI();
    refreshQuote();
  });
  $("#regionGroup")?.addEventListener("change", refreshQuote);
  $("#receiptFile")?.addEventListener("change", autoUploadReceipt);

  toggleLalamoveUI();
  refreshQuote();

  if (forceOpen) root.scrollIntoView({ behavior: "smooth" });
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

function inferRegionFromAddress(address) {
  const t = String(address || "").toLowerCase();
  if (!t) return null;

  const NCR = [
    "quezon city", "qc", "mandaluyong", "makati", "taguig", "pasig", 
    "manila", "parañaque", "paranaque", "caloocan", "las piñas", 
    "las pinas", "valenzuela", "marikina", "malabon", "navotas", 
    "muntinlupa", "pasay", "pateros", "san juan"
  ];

  const LUZON = [
    "pampanga", "bulacan", "cavite", "laguna", "batangas", "rizal",
    "tarlac", "bataan", "zambales", "pangasinan", "isabela",
    "nueva ecija", "la union", "ilocos norte", "ilocos sur", "cagayan",
    "benguet", "abra", "mountain province", "kalinga", "apayao", "ifugao",
    "aurora", "nueva vizcaya", "quirino", "quezon province", "albay", 
    "camarines norte", "camarines sur", "catanduanes", "masbate", "sorsogon",
    "marinduque", "oriental mindoro", "occidental mindoro", "romblon", "batanes"
  ];

  const VISAYAS = [
    "cebu", "cebu city", "bohol", "siquijor", "iloilo", "iloilo city", 
    "negros occidental", "negros oriental", "guimaras", "aklan", "antique", "capiz",
    "leyte", "southern leyte", "biliran", "samar", "eastern samar", "northern samar"
  ];

  const MINDANAO = [
    "davao del sur", "davao del norte", "davao oriental", "davao occidental", 
    "davao de oro", "davao city", "gensan", "general santos", "cotabato city", 
    "zamboanga del norte", "zamboanga del sur", "zamboanga sibugay", "zamboanga city", 
    "cagayan de oro", "bukidnon", "misamis oriental", "misamis occidental", "lanao del norte", 
    "camiguin", "agusan del norte", "agusan del sur", "butuan", "surigao del norte", 
    "surigao del sur", "dinagat islands", "cotabato", "south cotabato", "sultan kudarat", "sarangani",
  ];

  const ISLAND = [
    "palawan", "siargao", "batanes", "camiguin", "siquijor island", "basilan", "lanao del sur", 
    "maguindanao del sur", "sulu", "tawi-tawi"
  ];

  const containsAny = (list) => list.some(k => t.includes(k));

  if (containsAny(NCR)) return "NCR";
  if (containsAny(LUZON)) return "LUZON";
  if (containsAny(VISAYAS)) return "VISAYAS";
  if (containsAny(MINDANAO)) return "MINDANAO";
  if (containsAny(ISLAND)) return "ISLAND";

  return null; // di ma-detect, ok lang, wag pilitin
}

/* ---------- Finalize order (clean version) ---------- */
async function finalizeOrder(){
  const buyer = {
    name: $("#name")?.value?.trim(),
    email: $("#email")?.value?.trim(),
    address: $("#address")?.value?.trim(),
    contact: $("#contact")?.value?.trim() || ""
  };

  const courier = $("#courier").value;
  const region  = $("#regionGroup")?.value || "NCR";
  const payment_method = $("#paymentMethod").value;
  const isLalamove = courier === "LALAMOVE";

  // ========= BASIC VALIDATION =========
  // Name + email always required
  if (!buyer.name || !buyer.email) {
    return toast("Please fill in your full name and email.", "warning");
  }

  // Address + contact required ONLY for J&T
  if (!isLalamove && (!buyer.address || !buyer.contact)) {
    return toast("Please fill in your address and contact number for J&T shipping.", "warning");
  }

  // Valid email
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyer.email)) {
    return toast("Please enter a valid email address.", "warning");
  }

  // Contact number format check – J&T lang
  if (!isLalamove && buyer.contact && !/^\d{10,13}$/.test(buyer.contact.replace(/\D/g, ""))) {
    return toast("Contact number must be 10–13 digits.", "warning");
  }

  // Receipt required (same as before)
  const fileField = $("#receiptFile");
  const file = fileField?.files?.[0];
  if (!file && !state.tempReceiptId) {
    return toast("Please attach a receipt/proof of payment.", "warning");
  }

  // Cart check
  const items = [...state.cart.values()].map(i => ({ id: i.id, qty: i.qty }));
  if (!items.length) {
    return toast("Your cart is empty.", "warning");
  }

  // ========= ADDRESS vs REGION CHECK (J&T only) =========
    // ========= ADDRESS vs REGION CHECK (J&T only) =========
  if (!isLalamove) {
    const inferred = inferRegionFromAddress(buyer.address);

    // 1) Walang ma-detect na kahit ano sa list → kailangan betin ang address
    if (!inferred) {
      return toast(
        "We couldn't detect your region from the address. Please include your city/province (e.g. Quezon City, Cebu, Davao) and make sure it matches the Region dropdown.",
        "warning"
      );
    }

    // 2) Na-detect pero hindi tugma sa piniling Region
    if (inferred !== region) {
      return toast(
        `Your address looks like it is in ${inferred}, but you selected ${region}. Please update the Region dropdown to match your address.`,
        "warning"
      );
    }
  }


  // For Lalamove: shipping fee = 0, buyer will book pickup
  const shipping_fee = isLalamove ? 0 : null;

  const btn = $("#finalizeBtn");
  btn.disabled = true;
  btn.textContent = "Placing…";

  try {
    // Upload receipt if needed
    let receiptFileId = state.tempReceiptId;
    if (!receiptFileId && file) {
      const b64 = await fileToBase64(file);
      const up = await apiFetch(`${API}?action=uploadTempReceipt`, {
        method: "POST",
        body: JSON.stringify({
          base64: String(b64).split(",")[1],
          mimeType: file.type || "image/png",
          filename: file.name
        })
      });
      receiptFileId = up.file_id;
    }

    // Finalize order sa backend
    const res = await apiFetch(`${API}?action=finalizeOrder`, {
      method: "POST",
      body: JSON.stringify({
        items,
        buyer,
        payment_method,
        courier,
        region_group: region,
        shipping_fee,
        receipt_file_id: receiptFileId
      })
    });

    state.order = {
      order_id: res.order_id,
      subtotal: Number(res.subtotal || 0),
      shipping_fee: Number(res.shipping_fee || 0),
      total: Number(res.total || 0),
      courier,
      region_group: region
    };

    // Save buyer info for next visit
    localStorage.setItem("zen_buyer", JSON.stringify(buyer));

    // Success UI
    toast("Order placed successfully!", "success");
    showOrderSuccess(state.order.order_id);

    // Clean up
    state.cart.clear();
    state.quote = null;
    state.tempReceiptId = null;
    state.tempReceiptName = null;
    if (fileField) fileField.value = "";
    renderCheckoutPanel();
  } catch (err) {
    console.error(err);
    toast("Order failed: " + (err.message || err), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
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
function toast(message, type = "info") {
  const toast = document.getElementById("toast") || (() => {
    const el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
    return el;
  })();

  toast.className = `toast show ${type}`;
  toast.textContent = message;

  setTimeout(() => toast.classList.remove("show"), 3500);
}

function showOrderSuccess(orderId){
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop order-success";

  backdrop.innerHTML = `
    <div class="modal-success" role="dialog">
      <h2>Order Confirmed 🎉</h2>
      <p>Your order has been placed successfully!</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p>We’ll send you a confirmation email once your order has been shipped.</p>
      <button class="btn primary" onclick="this.closest('.modal-backdrop').remove()">OK</button>
    </div>
  `;

  document.body.appendChild(backdrop);
}




function openProductModal(id) {
  const product = state.products.find(p => String(p.id) === String(id));
  if (!product) return;

  const isSoldOut = Number(product.stock) <= 0;
  const lowStock  = !isSoldOut && Number(product.stock) <= 2;

  // multiple images support kung meron, else fallback sa image_url
  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image_url];

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle-${product.id}">
      
      <div class="modal-header">
        <h3 id="modalTitle-${product.id}">${product.name}</h3>
        <button class="modal-close-btn" aria-label="Close"
          onclick="this.closest('.modal-backdrop').remove()">×</button>
      </div>

      <div class="modal-product-layout">
        
        <!-- LEFT: image + thumbs -->
        <div class="modal-product-image-section">
          <img
            id="modal-main-${product.id}"
            class="modal-main-image"
            src="${images[0]}"
            alt="${product.name}"
          />

          ${images.length > 1 ? `
          <div class="modal-image-thumbs">
            ${images.map((src, index) => `
              <button
                type="button"
                class="${index === 0 ? "active" : ""}"
                data-modal-thumb="${product.id}"
                onclick="changeModalImage('${product.id}', ${index}, '${src.replace(/'/g,"\\'")}')">
                <img src="${src}" alt="${product.name} photo ${index + 1}">
              </button>
            `).join("")}
          </div>` : ""}
        </div>

        <!-- RIGHT: info -->
        <div class="modal-product-info-section">

          <div class="modal-meta v">
            <div class="price">${currency(product.price)}</div>
            <div class="stock ${isSoldOut ? "sold" : lowStock ? "low" : ""}">
              Stock: ${product.stock}
            </div>
          </div>

          <div class="modal-actions right">
            <div class="qty-stepper">
              <button type="button" class="btn ghost"
                onclick="stepQty('${product.id}', -1)" ${isSoldOut ? "disabled" : ""}>-</button>

              <input
                id="mqty-${product.id}"
                type="number"
                min="1"
                max="${product.stock}"
                value="${isSoldOut ? 0 : 1}"
                ${isSoldOut ? "disabled" : ""}
              />

              <button type="button" class="btn ghost"
                onclick="stepQty('${product.id}', 1)" ${isSoldOut ? "disabled" : ""}>+</button>
            </div>

            <button class="btn primary"
              onclick="addToCartFromModal('${product.id}')"
              ${isSoldOut ? "disabled" : ""}>
              ${isSoldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>

          <div class="modal-body">
            ${renderDesc(product.description)}
          </div>

        </div>
      </div>
    </div>
  `;

  // close when clicking outside the modal card
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  document.body.appendChild(backdrop);
}


// helper: +/− buttons
function stepQty(id, delta){
  const el = document.getElementById(`mqty-${id}`);
  if(!el) return;
  const max = Number(el.getAttribute("max") || 1);
  const min = Number(el.getAttribute("min") || 1);
  let v = Number(el.value || 1) + delta;
  v = Math.max(min, Math.min(max, v));
  el.value = v;
}

// helper: add to cart from modal
function addToCartFromModal(id){
  const qty = Number(document.getElementById(`mqty-${id}`)?.value || 1);
  const mainQty = document.getElementById(`qty-${id}`); // sync with card if present
  if (mainQty) mainQty.value = qty;
  addToCart(id);
  document.querySelector(".modal-backdrop")?.remove();
  toast("Added to cart");
}

function changeModalImage(productId, index, src) {
  const main = document.getElementById(`modal-main-${productId}`);
  if (main && src) main.src = src;

  const thumbs = document.querySelectorAll(`[data-modal-thumb="${productId}"]`);
  thumbs.forEach((btn, i) => {
    if (i === index) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}


// helper: render simple bullets if description contains lines
function renderDesc(text){
  const t = String(text || "").trim();
  if(!t) return `<p class="modal-desc muted">No description available.</p>`;
  // Split on line breaks or • and build bullets when appropriate
  const lines = t.split(/\n|•/).map(s=>s.trim()).filter(Boolean);
  if (lines.length <= 1) return `<p class="modal-desc">${t}</p>`;
  return `<ul class="modal-list">` + lines.map(l=>`<li>${l}</li>`).join("") + `</ul>`;
}

/* =======================
   BULK CATALOGUE (READ-ONLY)
========================== */

async function loadBulkProducts() {
  const root = document.getElementById("bulkRoot");
  if (!root) return;

  root.innerHTML = `<p class="muted">Loading catalogue…</p>`;

  try {
    const data = await apiFetch(`${API}?action=bulk`);
    const items = data.items || [];

    bulkState.items = items;

    if (!items.length) {
      root.innerHTML = `<p class="muted">No bulk products found.</p>`;
      return;
    }

    root.innerHTML = items.map((p, index) => {
      const img = p.image_url
        ? `./assets/${p.image_url}`
        : forceImagePath(p.name);

      return `
        <article class="product-card bulk-card" role="button"
                onclick="openBulkModal(${index})">
          <div class="bulk-image-wrap">
            <img class="product-card-image"
                src="${img}"
                alt="${p.name}">
          </div>

          <div class="bulk-info">
            <p class="bulk-name">${p.name}</p>
            <p class="bulk-price">${currency(p.price)}</p>
          </div>
        </article>
        `;
    }).join("");

  } catch (err) {
    console.error("Bulk catalogue error:", err);
    root.innerHTML = `<p class="error">Error loading catalogue: ${err}</p>`;
  }
}

function splitLines(val) {
  return String(val || "")
    .split(/[;,\n•]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function openBulkModal(index) {
  const p = bulkState.items[index];
  if (!p) return;

  const img = p.image_url
    ? `./assets/${p.image_url}`
    : forceImagePath(p.name);

  // lines for flavor_profile / best_for
  const splitLines = (val) =>
    String(val || "")
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(Boolean);

  const flavors = splitLines(p.flavor_profile);
  const bestFor = splitLines(p.best_for);

  const samplePrice =
    p.sample_price ? (isNaN(p.sample_price)
      ? p.sample_price
      : currency(p.sample_price)) : null;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <div class="modal-content bulk-modal" role="dialog" aria-modal="true">
      <div class="modal-header bulk-modal-header">
        <button class="modal-close-btn" aria-label="Close"
          onclick="this.closest('.modal-backdrop').remove()">×</button>
      </div>

      <div class="modal-product-layout bulk-layout">
        <!-- LEFT: name + big image -->
        <div class="bulk-left">
          <h3 class="bulk-title">${p.name}</h3>
          <div class="modal-product-image-section bulk-image">
            <img class="modal-main-image"
                 src="${img}"
                 alt="${p.name}">
          </div>
        </div>

        <!-- RIGHT: specs -->
        <div class="modal-product-info-section bulk-info">
          <div class="bulk-price-block">
            <div class="bulk-main-price">${currency(p.price)}</div>
            ${samplePrice ? `<div class="bulk-sample-price">Sample: ${samplePrice}</div>` : ""}
          </div>

          <dl class="bulk-spec-grid">
            ${p.origin ? `<dt>Origin</dt><dd>${p.origin}</dd>` : ""}
            ${p.grade  ? `<dt>Grade</dt><dd>${p.grade}</dd>` : ""}
            ${p.type   ? `<dt>Type</dt><dd>${p.type}</dd>` : ""}
            ${p.use    ? `<dt>Use</dt><dd>${p.use}</dd>` : ""}
            ${flavors.length ? `
              <dt>Flavor Profile</dt>
              <dd>${flavors.join("<br>")}</dd>
            ` : ""}
            ${bestFor.length ? `
              <dt>Best For</dt>
              <dd>${bestFor.join("<br>")}</dd>
            ` : ""}
          </dl>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  document.body.appendChild(backdrop);
}

