window.SHOP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbxEAkQHM17G3aZcWnXrMwssUisJFCUfLUyMNQbcYhE0mqTIm5v7CmoTQ74JlkkHUDkc/exec",
  SHARED_SECRET: "zenNsipwillbebig1121",
  IG_URL: "https://www.instagram.com/zennsip.ph",

  // ✅ TEMP PROMO (auto-off by date)
  PROMO: {
    id: "CANS_TIER_DEC",
    label: "Bundle Discount",
    start: "2025-12-21", // YYYY-MM-DD
    end:   "2026-01-01", // YYYY-MM-DD (inclusive)
    tiers: [
      { minQty: 3, discount: 200 },
      { minQty: 2, discount: 100 }
    ]
  }
};
