# Starter Shop (GitHub Pages + Google Sheets + Apps Script)

This is a minimal example storefront that reads products from Google Sheets via an Apps Script Web App, lets customers add items to a cart, submit an order, shows QR codes for payment, and uploads a receipt image back to Google Drive.

## Files
- `index.html` – main page with catalog, cart, and checkout
- `app.js` – frontend logic
- `styles.css` – simple styling
- `config.example.js` – template for your API URL and shared secret
- `apps_script/Code.gs` – Apps Script backend (copy into Apps Script editor)
- `assets/` – placeholder images (QRs, sample product)
- `README.md` – this file

### Quick Start
1. Finish the Google Sheet + Apps Script setup in the guide.
2. Put your Web App URL and SHARED_SECRET into `config.js` (copy from `config.example.js`).
3. Push this folder to a GitHub repo and enable GitHub Pages (root or `/docs`).
4. Open your site and test!

**Guide:** Follow the step-by-step instructions provided in ChatGPT.
