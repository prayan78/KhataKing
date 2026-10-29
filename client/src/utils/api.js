import { DEFAULT_SHOP, DEFAULT_PRODUCTS, DEFAULT_CUSTOMERS, DEFAULT_SUPPLIERS } from './defaultData';

/**
 * Returns the effective API Base URL.
 * In Android Emulator: default 'http://10.0.2.2:5000'
 * In Web Browser: default '' (uses Vite proxy or same origin)
 */
export const getApiBaseUrl = () => {
  const custom = localStorage.getItem('kk_api_server_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }

  // Detect Capacitor / Native Android
  const isCapacitor = 
    window.Capacitor !== undefined || 
    window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && !window.location.port);

  if (isCapacitor) {
    // 10.0.2.2 is the special IP alias for the host computer in Android Emulator
    return 'http://10.0.2.2:5000';
  }

  return '';
};

export const setApiBaseUrl = (url) => {
  if (!url) {
    localStorage.removeItem('kk_api_server_url');
  } else {
    localStorage.setItem('kk_api_server_url', url.trim());
  }
};

export const testServerConnection = async (targetUrl = null) => {
  const base = targetUrl !== null ? targetUrl.replace(/\/+$/, '') : getApiBaseUrl();
  const url = `${base}/api/shop`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const text = await res.text();
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text);
      if (data && data.success) return { connected: true, message: 'Connected to KhataKing Server' };
    }
    return { connected: false, message: 'Received non-JSON response from server' };
  } catch (err) {
    return { connected: false, message: err.name === 'AbortError' ? 'Connection timed out' : 'Cannot reach server' };
  }
};

/**
 * Robust fetch that handles both network errors and unexpected HTML gracefully
 */
export const apiFetch = async (endpoint, options = {}) => {
  const base = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  const res = await fetch(url, options);
  const text = await res.text();

  // If response is HTML (e.g. 404 falling back to index.html or offline Capacitor webview)
  if (text.trim().startsWith('<') || text.trim().startsWith('<!doctype')) {
    throw new Error('SERVER_HTML_RESPONSE');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('INVALID_JSON_RESPONSE');
  }
};

/**
 * Local offline store helpers (guarantees zero crashes on phone even when completely offline)
 */
export const getLocalStore = (key, defaultVal) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

export const setLocalStore = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

export const formatErrorMessage = (err, lang = 'ne') => {
  if (!err) return '';
  const msg = typeof err === 'string' ? err : (err.message || '');
  if (
    msg.includes('Unexpected token') || 
    msg.includes('<!doctype') || 
    msg.includes('SERVER_HTML_RESPONSE') || 
    msg.includes('INVALID_JSON_RESPONSE') ||
    msg.includes('Failed to fetch') || 
    msg.includes('NetworkError')
  ) {
    return lang === 'en' 
      ? 'Backend server not responding. Continuing with local data...' 
      : 'सर्भर जोडिन सकेन। अफलाइन डाटा प्रयोग गरिएको छ।';
  }
  return msg;
};

// Initializers
export const getInitialProducts = () => {
  return getLocalStore('kk_cached_prods', DEFAULT_PRODUCTS);
};

export const getInitialCustomers = () => {
  return getLocalStore('kk_cached_custs', DEFAULT_CUSTOMERS);
};

export const getInitialSuppliers = () => {
  return getLocalStore('kk_cached_supps', DEFAULT_SUPPLIERS);
};

export const getInitialShop = () => {
  return getLocalStore('kk_cached_shop', DEFAULT_SHOP);
};

// Offline Sale Recording
export const recordOfflineSale = (saleData) => {
  const sales = getLocalStore('kk_offline_sales', []);
  const saleNumber = 'KK-' + (1000 + sales.length + 1);
  const newSale = {
    _id: 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(7),
    shopId: 'shop_kirana_001',
    saleNumber,
    ...saleData,
    date: new Date().toISOString()
  };

  sales.unshift(newSale);
  setLocalStore('kk_offline_sales', sales);

  // Deduct stock locally
  const products = getInitialProducts();
  let prodsChanged = false;
  if (newSale.items?.length) {
    for (const item of newSale.items) {
      if (item.productId) {
        const p = products.find(prod => prod._id === item.productId);
        if (p) {
          p.stockQty = Math.max(0, (p.stockQty || 0) - item.quantity);
          prodsChanged = true;
        }
      }
    }
  }
  if (prodsChanged) {
    setLocalStore('kk_cached_prods', products);
  }

  // Update customer balance locally if credit sale
  if (newSale.paymentType === 'credit') {
    const customers = getInitialCustomers();
    let cust = customers.find(c => c._id === newSale.customerId || c.name === newSale.customerName);
    if (!cust && newSale.customerName) {
      cust = {
        _id: 'cust_' + Date.now(),
        name: newSale.customerName,
        phone: newSale.customerPhone || '',
        totalUdharo: 0
      };
      customers.push(cust);
    }
    if (cust) {
      cust.totalUdharo = (cust.totalUdharo || 0) + Number(newSale.grandTotal || 0);
      setLocalStore('kk_cached_custs', customers);
    }
  }

  return newSale;
};

// Offline Totals Computation
export const getOfflineTotals = (period = 'today') => {
  const sales = getLocalStore('kk_offline_sales', []);
  const now = new Date();
  let startDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = now.getDay();
    startDate.setDate(now.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'year') {
    startDate.setMonth(0, 1);
    startDate.setHours(0, 0, 0, 0);
  }

  const startISO = startDate.toISOString();
  const filteredSales = sales.filter(s => s.date >= startISO);
  const totalSales = filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const cashSales = filteredSales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const creditSales = filteredSales.filter(s => s.paymentType === 'credit').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const customers = getInitialCustomers();
  const suppliers = getInitialSuppliers();

  return {
    period,
    totalSales,
    transactionCount: filteredSales.length,
    cashSales,
    creditSales,
    oldCreditCollections: 0,
    totalCashInDrawer: cashSales,
    paymentsMadeToSuppliers: 0,
    totalCustomerUdharo: customers.reduce((sum, c) => sum + (c.totalUdharo || 0), 0),
    totalSupplierPayable: suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0),
    transactions: filteredSales
  };
};
