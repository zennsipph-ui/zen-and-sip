// ===== CONFIG =====
const SHEET_PRODUCTS = 'Products';  // name of the sheet tab for products
const SHEET_ORDERS   = 'Orders';    // name of the sheet tab for orders
const DRIVE_FOLDER_ID = '1-O783whUvaUXFIzyvi587xqF6m0JiOBY'; // <-- change this to your receipts folder ID
const SHARED_SECRET   = 'zenNsipwillbebig1121'; // <-- make any random secret (like "abc123xyz"). Will match with your website

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'ping';
    var secret = (e && e.parameter && e.parameter.secret) || '';
    if (secret !== SHARED_SECRET && action !== 'ping') {
      return json_({ ok: false, error: 'unauthorized' });
    }

    if (action === 'products') {
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sh = ss.getSheetByName('Products');
      var rows = sh.getDataRange().getValues();
      var header = rows.shift();
      var items = rows.map(function (r) {
        return {
          id: r[0], name: r[1], price: r[2], stock: r[3],
          image_url: r[4], is_active: r[5]
        };
      }).filter(function (x) { return x.is_active === true || String(x.is_active).toUpperCase() === 'TRUE'; });

      return json_({ ok: true, items: items });
    }

    if (action === 'ping') {
      return json_({ ok: true, who: Session.getActiveUser().getEmail() || 'anon' });
    }

    // fallback para hindi na lalabas "did not return anything"
    return json_({ ok: false, error: 'missing/unknown action' });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}


function doPost(e) {
  try {
    if (!checkSecret_(e)) return json_({ ok:false, error:'unauthorized' });

    const path = (e.parameter && e.parameter.path) || '';
    const body = (e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};

    if (path === 'uploadReceipt') return uploadReceipt_(body);
    if (path === 'order')         return createOrder_(body); // keep your existing implementation

    return json_({ ok:false, error:'unknown path' });
  } catch (err) {
    Logger.log('doPost error: ' + err.stack);
    return json_({ ok:false, error:String(err) });
  }
}

function getProducts_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_PRODUCTS);
  const rows = sh.getDataRange().getValues();
  const header = rows.shift();
  const idx = index_(header);
  const items = rows
    .filter(r => String(r[idx.is_active]).toLowerCase() === 'true')
    .map(r => ({
      id: String(r[idx.id]),
      name: r[idx.name],
      price: Number(r[idx.price]),
      stock: Number(r[idx.stock]),
      image_url: r[idx.image_url],
    }));
  return json_({ok:true, items});
}

function createOrder_(data) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const ps = ss.getSheetByName(SHEET_PRODUCTS);
    const os = ss.getSheetByName(SHEET_ORDERS);
    const pVals = ps.getDataRange().getValues();
    const header = pVals.shift();
    const idx = index_(header);
    const rowMap = new Map(pVals.map(r => [String(r[idx.id]), r]));

    let subtotal = 0;
    (data.items || []).forEach(it => {
      const row = rowMap.get(String(it.id));
      if (!row) throw new Error('Product not found: ' + it.id);
      const price = Number(row[idx.price]);
      const stock = Number(row[idx.stock]);
      const qty = Number(it.qty || 0);
      if (qty < 1) throw new Error('Invalid qty for ' + row[idx.name]);
      if (qty > stock) throw new Error(`Insufficient stock for ${row[idx.name]} (left: ${stock})`);
      subtotal += price * qty;
    });

    // Deduct stock
    for (let rIdx=0; rIdx<pVals.length; rIdx++) {
      const row = pVals[rIdx];
      const id = String(row[idx.id]);
      const cartItem = (data.items || []).find(it => String(it.id) === id);
      if (cartItem) {
        const newStock = Number(row[idx.stock]) - Number(cartItem.qty);
        ps.getRange(rIdx+2, idx.stock+1).setValue(newStock);
      }
    }

    const orderId = 'ORD-' + new Date().getTime();
    os.appendRow([
      new Date(),
      orderId,
      JSON.stringify(data.items || []),
      subtotal,
      data.buyer?.name || '',
      data.buyer?.email || '',
      data.buyer?.address || '',
      data.payment_method || 'GCash',
      'PENDING_PROOF',
      '' // receipt_file_id
    ]);

    return json_({ok:true, order_id: orderId, subtotal});
  } catch (err) {
    return json_({ok:false, error: err.message});
  } finally {
    lock.releaseLock();
  }
}

function uploadReceipt_(data) {
  try {
    if (!data || !data.order_id || !data.base64) throw new Error('Missing fields');

    // decode and write to Drive
    const bytes = Utilities.base64Decode(data.base64);
    const blob  = Utilities.newBlob(bytes, data.mimeType || 'image/png', data.filename || ('receipt_'+Date.now()+'.png'));

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file   = folder.createFile(blob).setName((data.filename || 'receipt') + ' - ' + data.order_id);

    // update Orders sheet
    const sh   = SpreadsheetApp.getActive().getSheetByName(SHEET_ORDERS);
    const last = sh.getLastRow();
    if (last >= 2) {
      const ids = sh.getRange(2, 2, last-1, 1).getValues().flat(); // col B = order_id
      const idx = ids.indexOf(data.order_id);
      if (idx === -1) throw new Error('Order ID not found in sheet: ' + data.order_id);

      const row = idx + 2;
      // I (9)=payment_status, J(10)=receipt_file_id
      sh.getRange(row, 10).setValue(file.getId());
      sh.getRange(row,  9).setValue('AWAITING_VERIFICATION');
    }

    return json_({ ok:true, file_id:file.getId() });
  } catch (err) {
    Logger.log('uploadReceipt_ error: ' + err.stack);
    return json_({ ok:false, error:String(err) });
  }
}



// ===== helpers =====
function index_(header){
  const map = {};
  header.forEach((h,i)=> map[String(h).trim().toLowerCase()] = i);
  return {
    raw: map,
    id: map['id'],
    name: map['name'],
    price: map['price'],
    stock: map['stock'],
    image_url: map['image_url'],
    is_active: map['is_active']
  };
}
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
         .setMimeType(ContentService.MimeType.JSON);
}
function checkSecret_(e){
  const q = (e && e.parameter && e.parameter.secret) || '';
  const x = (e && e.headers && e.headers['x-secret']) || '';
  return q === SHARED_SECRET || x === SHARED_SECRET;
}

function pingDriveAuth() {
  DriveApp.getFolderById(DRIVE_FOLDER_ID).getName();
}

