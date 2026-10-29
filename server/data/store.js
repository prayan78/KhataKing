import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDBStatus } from '../config/db.js';
import { Shop } from '../models/Shop.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Sale } from '../models/Sale.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { StockMovement } from '../models/StockMovement.js';
import { ScanBatch } from '../models/ScanBatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'khataking_store.json');

// Default initial Kirana data
const DEFAULT_SHOP_ID = 'shop_kirana_001';

const getInitialSeed = () => ({
  shop: {
    _id: DEFAULT_SHOP_ID,
    name: 'शुभलाभ किराना स्टोर (Shubhalabh Kirana)',
    ownerName: 'राम प्रसाद श्रेष्ठ',
    phone: '9841234567',
    address: 'असन, काठमाडौँ',
    panNumber: '304918274',
    currency: 'NPR',
    language: 'ne',
    createdAt: new Date().toISOString()
  },
  products: [
    {
      _id: 'prod_1',
      shopId: DEFAULT_SHOP_ID,
      name: 'सोना मन्सुली चामल (२५ के.जी.)',
      nameEn: 'Sona Mansuli Rice 25kg',
      sellingPrice: 1950,
      costPrice: 1750,
      stockQty: 32,
      unit: 'पोका',
      minStockAlert: 5,
      barcode: '8901230001',
      category: 'खाद्यान्न',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_2',
      shopId: DEFAULT_SHOP_ID,
      name: 'धारा सनफ्लावर तेल (१ लिटर)',
      nameEn: 'Dhara Sunflower Oil 1L',
      sellingPrice: 240,
      costPrice: 215,
      stockQty: 48,
      unit: 'बोतल',
      minStockAlert: 10,
      barcode: '8901230002',
      category: 'तेल तथा घ्यू',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_3',
      shopId: DEFAULT_SHOP_ID,
      name: 'चिनी (१ के.जी.)',
      nameEn: 'Sugar 1kg',
      sellingPrice: 105,
      costPrice: 94,
      stockQty: 85,
      unit: 'के.जी.',
      minStockAlert: 15,
      barcode: '8901230003',
      category: 'खाद्यान्न',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_4',
      shopId: DEFAULT_SHOP_ID,
      name: 'मसुरो दाल (१ के.जी.)',
      nameEn: 'Masuro Daal 1kg',
      sellingPrice: 160,
      costPrice: 142,
      stockQty: 40,
      unit: 'के.जी.',
      minStockAlert: 10,
      barcode: '8901230004',
      category: 'दाल तथा गेडागुडी',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_5',
      shopId: DEFAULT_SHOP_ID,
      name: 'वाइवाइ चाउचाउ (१ पोका)',
      nameEn: 'Wai Wai Noodles 1pkt',
      sellingPrice: 25,
      costPrice: 21,
      stockQty: 120,
      unit: 'पोका',
      minStockAlert: 24,
      barcode: '8901230005',
      category: 'खाजा तथा स्न्याक्स',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_6',
      shopId: DEFAULT_SHOP_ID,
      name: 'डिडिसी गाईको दूध (आधा लिटर)',
      nameEn: 'DDC Cow Milk 500ml',
      sellingPrice: 50,
      costPrice: 44,
      stockQty: 18,
      unit: 'पोका',
      minStockAlert: 8,
      barcode: '8901230006',
      category: 'दुग्धजन्य',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_7',
      shopId: DEFAULT_SHOP_ID,
      name: 'ताजा अण्डा (१ क्रेट - ३० वटा)',
      nameEn: 'Fresh Eggs 1 Crate (30 pcs)',
      sellingPrice: 440,
      costPrice: 400,
      stockQty: 14,
      unit: 'थान',
      minStockAlert: 4,
      barcode: '8901230007',
      category: 'खाद्य',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_8',
      shopId: DEFAULT_SHOP_ID,
      name: 'आयोडिन नुन (१ के.जी.)',
      nameEn: 'Iodized Salt 1kg',
      sellingPrice: 26,
      costPrice: 22,
      stockQty: 60,
      unit: 'पोका',
      minStockAlert: 15,
      barcode: '8901230008',
      category: 'खाद्यान्न',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_9',
      shopId: DEFAULT_SHOP_ID,
      name: 'टोकला चियापत्ती (५०० ग्राम)',
      nameEn: 'Tokla Tea 500g',
      sellingPrice: 290,
      costPrice: 260,
      stockQty: 22,
      unit: 'पोका',
      minStockAlert: 6,
      barcode: '8901230009',
      category: 'खाद्यान्न',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: 'prod_10',
      shopId: DEFAULT_SHOP_ID,
      name: 'लाइफब्वाय साबुन (१ थान)',
      nameEn: 'Lifebuoy Soap 1pc',
      sellingPrice: 45,
      costPrice: 38,
      stockQty: 35,
      unit: 'थान',
      minStockAlert: 10,
      barcode: '8901230010',
      category: 'सरसफाइ',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ],
  customers: [
    {
      _id: 'cust_1',
      shopId: DEFAULT_SHOP_ID,
      name: 'श्याम बहादुर थापा (Shyam Bdr Thapa)',
      phone: '9851011223',
      address: 'असन टोल',
      totalUdharo: 2850,
      notes: 'नियमित छिमेकी ग्राहक',
      lastTransactionDate: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      _id: 'cust_2',
      shopId: DEFAULT_SHOP_ID,
      name: 'सीता देवी पौडेल (Sita Devi Paudel)',
      phone: '9841887766',
      address: 'इन्द्रचोक',
      totalUdharo: 1420,
      notes: 'महिनावारी तिर्ने',
      lastTransactionDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      _id: 'cust_3',
      shopId: DEFAULT_SHOP_ID,
      name: 'हरि कृष्ण श्रेष्ठ (Hari Krishna)',
      phone: '9813554433',
      address: 'क्षेत्रपाटी',
      totalUdharo: 0,
      notes: 'सबै चुक्ता भयो',
      lastTransactionDate: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ],
  suppliers: [
    {
      _id: 'supp_1',
      shopId: DEFAULT_SHOP_ID,
      name: 'विशाल दाल तथा तेल सप्लायर्स (Bishal Suppliers)',
      phone: '9851099887',
      address: 'कालिमाटी',
      totalPayable: 14500,
      notes: 'हप्ताको शुक्रबार भुक्तानी',
      lastTransactionDate: new Date(Date.now() - 259200000).toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      _id: 'supp_2',
      shopId: DEFAULT_SHOP_ID,
      name: 'नेपाल किराना होलसेल डिस्ट्रीयूटर्स',
      phone: '9801234455',
      address: 'टेकु',
      totalPayable: 8200,
      notes: 'नगद तथा १५ दिने उधारो',
      lastTransactionDate: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ],
  sales: [
    {
      _id: 'sale_1',
      shopId: DEFAULT_SHOP_ID,
      saleNumber: 'KK-1001',
      idempotencyKey: 'idemp-1001',
      items: [
        { productId: 'prod_2', name: 'धारा सनफ्लावर तेल (१ लिटर)', quantity: 2, unitPrice: 240, lineTotal: 480, unit: 'बोतल' },
        { productId: 'prod_3', name: 'चिनी (१ के.जी.)', quantity: 3, unitPrice: 105, lineTotal: 315, unit: 'के.जी.' }
      ],
      grandTotal: 795,
      paymentType: 'cash',
      customerId: null,
      customerName: 'नगद ग्राहक (Cash Customer)',
      customerPhone: '',
      receivedAmount: 1000,
      changeAmount: 205,
      notes: 'दैनिक बिहानी बिक्री',
      date: new Date().toISOString(),
      isReturned: false
    },
    {
      _id: 'sale_2',
      shopId: DEFAULT_SHOP_ID,
      saleNumber: 'KK-1002',
      idempotencyKey: 'idemp-1002',
      items: [
        { productId: 'prod_1', name: 'सोना मन्सुली चामल (२५ के.जी.)', quantity: 1, unitPrice: 1950, lineTotal: 1950, unit: 'पोका' },
        { productId: 'prod_4', name: 'मसुरो दाल (१ के.जी.)', quantity: 2, unitPrice: 160, lineTotal: 320, unit: 'के.जी.' }
      ],
      grandTotal: 2270,
      paymentType: 'credit',
      customerId: 'cust_1',
      customerName: 'श्याम बहादुर थापा (Shyam Bdr Thapa)',
      customerPhone: '9851011223',
      receivedAmount: 0,
      changeAmount: 0,
      notes: 'उधारो खातामा चढाइएको',
      date: new Date().toISOString(),
      isReturned: false
    }
  ],
  ledgerEntries: [
    {
      _id: 'led_1',
      shopId: DEFAULT_SHOP_ID,
      partyType: 'Customer',
      partyId: 'cust_1',
      partyName: 'श्याम बहादुर थापा (Shyam Bdr Thapa)',
      direction: 'RECEIVABLE',
      entryType: 'SALE_CREDIT',
      amount: 2270,
      balanceAfter: 2850,
      referenceSaleId: 'sale_2',
      notes: 'सामान लगेको (चामल + दाल)',
      date: new Date().toISOString()
    },
    {
      _id: 'led_2',
      shopId: DEFAULT_SHOP_ID,
      partyType: 'Customer',
      partyId: 'cust_2',
      partyName: 'सीता देवी पौडेल (Sita Devi Paudel)',
      direction: 'RECEIVABLE',
      entryType: 'PAYMENT_RECEIVED',
      amount: 500,
      balanceAfter: 1420,
      referenceSaleId: null,
      notes: 'नगद बुझाएको (रसिद नं. ४५)',
      date: new Date().toISOString()
    },
    {
      _id: 'led_3',
      shopId: DEFAULT_SHOP_ID,
      partyType: 'Supplier',
      partyId: 'supp_1',
      partyName: 'विशाल दाल तथा तेल सप्लायर्स (Bishal Suppliers)',
      direction: 'PAYABLE',
      entryType: 'PAYMENT_MADE',
      amount: 5000,
      balanceAfter: 14500,
      referenceSaleId: null,
      notes: 'चेक मार्फत भुक्तानी',
      date: new Date().toISOString()
    }
  ],
  stockMovements: [
    {
      _id: 'sm_1',
      shopId: DEFAULT_SHOP_ID,
      productId: 'prod_2',
      productName: 'धारा सनफ्लावर तेल (१ लिटर)',
      type: 'SALE',
      delta: -2,
      beforeQty: 50,
      afterQty: 48,
      reason: 'बिक्री KK-1001',
      referenceId: 'sale_1',
      date: new Date().toISOString()
    },
    {
      _id: 'sm_2',
      shopId: DEFAULT_SHOP_ID,
      productId: 'prod_3',
      productName: 'चिनी (१ के.जी.)',
      type: 'SALE',
      delta: -3,
      beforeQty: 88,
      afterQty: 85,
      reason: 'बिक्री KK-1001',
      referenceId: 'sale_1',
      date: new Date().toISOString()
    }
  ],
  scanBatches: []
});

class KiranaStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialSeed();
        this.persist();
      }
    } catch (e) {
      console.warn('Error reading store file, reinitializing default:', e.message);
      this.data = getInitialSeed();
      this.persist();
    }
  }

  persist() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write store file:', e.message);
    }
  }

  // Shop
  async getShop(shopId = DEFAULT_SHOP_ID) {
    if (getDBStatus().isConnected) {
      try {
        let shop = await Shop.findById(shopId);
        if (!shop) shop = await Shop.findOne();
        if (shop) return shop;
      } catch (e) { /* fallback */ }
    }
    return this.data.shop;
  }

  async updateShop(shopId = DEFAULT_SHOP_ID, updateData) {
    if (getDBStatus().isConnected) {
      try {
        const shop = await Shop.findByIdAndUpdate(shopId, updateData, { new: true });
        if (shop) return shop;
      } catch (e) { /* fallback */ }
    }
    this.data.shop = { ...this.data.shop, ...updateData };
    this.persist();
    return this.data.shop;
  }

  // Products
  async getProducts(shopId = DEFAULT_SHOP_ID, search = '') {
    if (getDBStatus().isConnected) {
      try {
        const q = { shopId, isActive: true };
        if (search) {
          q.$or = [
            { name: { $regex: search, $options: 'i' } },
            { nameEn: { $regex: search, $options: 'i' } },
            { barcode: search }
          ];
        }
        return await Product.find(q).sort({ name: 1 });
      } catch (e) { /* fallback */ }
    }

    let prods = this.data.products.filter(p => p.isActive !== false);
    if (search) {
      const s = search.toLowerCase();
      prods = prods.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(s)) ||
        (p.barcode && p.barcode.includes(s))
      );
    }
    return prods;
  }

  async createProduct(shopId = DEFAULT_SHOP_ID, prodData) {
    const newProd = {
      _id: prodData._id || ('prod_' + Date.now() + '_' + Math.random().toString(36).substring(7)),
      shopId,
      name: prodData.name?.trim(),
      nameEn: prodData.nameEn?.trim() || '',
      brand: prodData.brand?.trim() || '',
      category: prodData.category?.trim() || 'General Kirana',
      variant: prodData.variant?.trim() || '',
      size: prodData.size?.trim() || '',
      sellingPrice: Number(prodData.sellingPrice) || 0,
      costPrice: Number(prodData.costPrice) || 0,
      stockQty: Number(prodData.stockQty) || 0,
      unit: prodData.unit || 'थान',
      minStockAlert: Number(prodData.minStockAlert) || 5,
      barcode: prodData.barcode || '',
      imageUrl: prodData.imageUrl || '',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (getDBStatus().isConnected) {
      try {
        return await Product.create(newProd);
      } catch (e) { /* fallback */ }
    }

    this.data.products.unshift(newProd);
    this.persist();
    return newProd;
  }

  async updateProduct(shopId = DEFAULT_SHOP_ID, productId, updateData) {
    let updated = null;
    if (getDBStatus().isConnected) {
      try {
        updated = await Product.findByIdAndUpdate(productId, { $set: updateData }, { new: true });
        if (updated && updated.toObject) updated = updated.toObject();
      } catch (e) {
        console.warn('Mongo updateProduct fallback:', e.message);
      }
    }

    const idx = this.data.products.findIndex(p => p._id === productId);
    if (idx !== -1) {
      this.data.products[idx] = {
        ...this.data.products[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      if (!updated) updated = this.data.products[idx];
      this.persist();
    }

    return updated;
  }

  async deleteProduct(shopId = DEFAULT_SHOP_ID, productId) {
    if (getDBStatus().isConnected) {
      try {
        await Product.findByIdAndDelete(productId);
      } catch (e) {
        console.warn('Mongo deleteProduct fallback:', e.message);
      }
    }

    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p._id !== productId);
    if (this.data.products.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  async adjustStock(shopId = DEFAULT_SHOP_ID, productId, delta, reason = 'म्यानुअल फेरबदल') {
    let prod = null;
    let beforeQty = 0;
    let afterQty = 0;

    if (getDBStatus().isConnected) {
      try {
        const p = await Product.findById(productId);
        if (p) {
          beforeQty = p.stockQty;
          afterQty = beforeQty + delta;
          p.stockQty = afterQty;
          await p.save();
          prod = p.toObject ? p.toObject() : p;
        }
      } catch (e) {
        console.warn('Mongo adjustStock fallback:', e.message);
      }
    }

    let localProd = this.data.products.find(p => p._id === productId);
    if (localProd) {
      if (!prod) {
        beforeQty = localProd.stockQty;
        afterQty = beforeQty + delta;
        prod = localProd;
      }
      localProd.stockQty = afterQty;
    }

    if (!prod) return null;

    const movement = {
      _id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      shopId,
      productId,
      productName: prod.name,
      type: delta >= 0 ? 'MANUAL_ADD' : 'MANUAL_REDUCE',
      delta,
      beforeQty,
      afterQty,
      reason,
      date: new Date().toISOString()
    };

    if (getDBStatus().isConnected) {
      try {
        await StockMovement.create(movement);
      } catch (e) {}
    }

    this.data.stockMovements.unshift(movement);
    this.persist();
    return { product: prod, movement };
  }

  // Customers (Receivables)
  async getCustomers(shopId = DEFAULT_SHOP_ID, search = '') {
    if (getDBStatus().isConnected) {
      try {
        const q = { shopId };
        if (search) {
          q.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ];
        }
        const list = await Customer.find(q).sort({ lastTransactionDate: -1, name: 1 }).lean();
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn('Mongo getCustomers fallback:', e.message);
      }
    }

    let list = this.data.customers;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(s) ||
        (c.phone && c.phone.includes(s))
      );
    }
    return list;
  }

  async createCustomer(shopId = DEFAULT_SHOP_ID, data) {
    const newCust = {
      _id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      shopId,
      name: data.name,
      phone: data.phone || '',
      address: data.address || '',
      totalUdharo: Number(data.totalUdharo) || 0,
      notes: data.notes || '',
      lastTransactionDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (getDBStatus().isConnected) {
      try {
        await Customer.create(newCust);
      } catch (e) {
        console.warn('Mongo createCustomer fallback:', e.message);
      }
    }

    this.data.customers.unshift(newCust);
    this.persist();
    return newCust;
  }

  // Suppliers (Payables)
  async getSuppliers(shopId = DEFAULT_SHOP_ID, search = '') {
    if (getDBStatus().isConnected) {
      try {
        const q = { shopId };
        if (search) {
          q.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ];
        }
        const list = await Supplier.find(q).sort({ lastTransactionDate: -1, name: 1 }).lean();
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn('Mongo getSuppliers fallback:', e.message);
      }
    }

    let list = this.data.suppliers;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(sub =>
        sub.name.toLowerCase().includes(s) ||
        (sub.phone && sub.phone.includes(s))
      );
    }
    return list;
  }

  async createSupplier(shopId = DEFAULT_SHOP_ID, data) {
    const newSupp = {
      _id: 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      shopId,
      name: data.name,
      phone: data.phone || '',
      address: data.address || '',
      totalPayable: Number(data.totalPayable) || 0,
      notes: data.notes || '',
      lastTransactionDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    if (getDBStatus().isConnected) {
      try {
        await Supplier.create(newSupp);
      } catch (e) {
        console.warn('Mongo createSupplier fallback:', e.message);
      }
    }

    this.data.suppliers.unshift(newSupp);
    this.persist();
    return newSupp;
  }

  // Sales (Cash & Credit, with inventory deduction & idempotency)
  async createSale(shopId = DEFAULT_SHOP_ID, saleData) {
    const { idempotencyKey, items, grandTotal, paymentType, customerId, customerName, customerPhone, receivedAmount, notes } = saleData;

    // Check duplicate submission
    if (idempotencyKey) {
      if (getDBStatus().isConnected) {
        try {
          const exist = await Sale.findOne({ idempotencyKey }).lean();
          if (exist) return exist;
        } catch (e) {}
      }
      const existing = this.data.sales.find(s => s.idempotencyKey === idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    let currentSaleCount = this.data.sales.length;
    if (getDBStatus().isConnected) {
      try {
        currentSaleCount = await Sale.countDocuments({ shopId });
      } catch (e) {}
    }

    const saleNumber = 'KK-' + (1000 + currentSaleCount + 1);
    const saleId = 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const date = new Date().toISOString();

    const newSale = {
      _id: saleId,
      shopId,
      saleNumber,
      idempotencyKey: idempotencyKey || ('auto_' + Date.now()),
      items: items.map(item => ({
        productId: item.productId || null,
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        lineTotal: Number(item.lineTotal) || (Number(item.quantity) * Number(item.unitPrice)),
        unit: item.unit || 'थान'
      })),
      grandTotal: Number(grandTotal) || 0,
      paymentType: paymentType || 'cash',
      customerId: customerId || null,
      customerName: customerName || (paymentType === 'credit' ? 'उधारो ग्राहक' : 'नगद ग्राहक (Cash Customer)'),
      customerPhone: customerPhone || '',
      receivedAmount: Number(receivedAmount) || (paymentType === 'cash' ? Number(grandTotal) : 0),
      changeAmount: Math.max(0, (Number(receivedAmount) || 0) - Number(grandTotal)),
      notes: notes || '',
      date,
      isReturned: false
    };

    // 1. Deduct stock for inventory items in Mongo and local memory
    for (const it of newSale.items) {
      if (it.productId) {
        let before = 0;
        let after = 0;
        let prodName = it.name;

        if (getDBStatus().isConnected) {
          try {
            const p = await Product.findById(it.productId);
            if (p) {
              before = p.stockQty;
              after = before - it.quantity;
              p.stockQty = after;
              await p.save();
              prodName = p.name;
            }
          } catch (e) {}
        }

        const prod = this.data.products.find(p => p._id === it.productId);
        if (prod) {
          if (!before) {
            before = prod.stockQty;
            after = before - it.quantity;
          }
          prod.stockQty = after;
        }

        const sm = {
          _id: 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(7),
          shopId,
          productId: it.productId,
          productName: prodName,
          type: 'SALE',
          delta: -it.quantity,
          beforeQty: before,
          afterQty: after,
          reason: `बिक्री रसिद ${saleNumber}`,
          referenceId: saleId,
          date
        };

        if (getDBStatus().isConnected) {
          try {
            await StockMovement.create(sm);
          } catch (e) {}
        }
        this.data.stockMovements.unshift(sm);
      }
    }

    // 2. If Credit Sale: record into Customer Udharo ledger in Mongo and local memory
    if (paymentType === 'credit') {
      let cust = null;
      if (getDBStatus().isConnected && customerId) {
        try {
          cust = await Customer.findById(customerId);
        } catch (e) {}
      }

      if (!cust && customerId) {
        cust = this.data.customers.find(c => c._id === customerId);
      }

      if (!cust && customerName) {
        cust = await this.createCustomer(shopId, {
          name: customerName,
          phone: customerPhone || '',
          totalUdharo: 0,
          notes: 'बिक्रीको क्रममा सिर्जना गरिएको'
        });
      }

      if (cust) {
        const beforeBalance = cust.totalUdharo || 0;
        const newBalance = beforeBalance + Number(grandTotal);

        if (getDBStatus().isConnected && cust._id) {
          try {
            await Customer.findByIdAndUpdate(cust._id, {
              totalUdharo: newBalance,
              lastTransactionDate: date
            });
          } catch (e) {}
        }

        const localCust = this.data.customers.find(c => c._id === cust._id);
        if (localCust) {
          localCust.totalUdharo = newBalance;
          localCust.lastTransactionDate = date;
        }

        const ledger = {
          _id: 'led_' + Date.now() + '_' + Math.random().toString(36).substring(7),
          shopId,
          partyType: 'Customer',
          partyId: cust._id,
          partyName: cust.name,
          direction: 'RECEIVABLE',
          entryType: 'SALE_CREDIT',
          amount: Number(grandTotal),
          balanceAfter: newBalance,
          referenceSaleId: saleId,
          notes: `उधारो सामान बिक्री (रसिद नं. ${saleNumber})`,
          date
        };

        if (getDBStatus().isConnected) {
          try {
            await LedgerEntry.create(ledger);
          } catch (e) {}
        }
        this.data.ledgerEntries.unshift(ledger);
      }
    }

    // 3. Save Sale to MongoDB
    if (getDBStatus().isConnected) {
      try {
        await Sale.create(newSale);
      } catch (e) {
        console.warn('Mongo createSale fallback:', e.message);
      }
    }

    this.data.sales.unshift(newSale);
    this.persist();
    return newSale;
  }

  async getSales(shopId = DEFAULT_SHOP_ID, limit = 50) {
    if (getDBStatus().isConnected) {
      try {
        const list = await Sale.find({ shopId }).sort({ date: -1 }).limit(limit).lean();
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn('Mongo getSales fallback:', e.message);
      }
    }
    return this.data.sales.slice(0, limit);
  }

  // Ledger: Add Udharo / Payment
  async addUdharoEntry(shopId = DEFAULT_SHOP_ID, entryData) {
    const { partyType, partyId, amount, entryType, notes } = entryData;
    const numAmount = Math.abs(Number(amount));
    const date = new Date().toISOString();

    let partyName = '';
    let newBalance = 0;

    if (partyType === 'Customer') {
      let cust = null;
      if (getDBStatus().isConnected) {
        try {
          cust = await Customer.findById(partyId);
        } catch (e) {}
      }
      if (!cust) {
        cust = this.data.customers.find(c => c._id === partyId);
      }
      if (!cust) throw new Error('ग्राहक फेला परेन (Customer not found)');
      partyName = cust.name;

      const currentBal = cust.totalUdharo || 0;
      if (entryType === 'SALE_CREDIT') {
        newBalance = currentBal + numAmount;
      } else if (entryType === 'PAYMENT_RECEIVED') {
        newBalance = currentBal - numAmount;
      } else {
        newBalance = currentBal;
      }

      if (getDBStatus().isConnected) {
        try {
          await Customer.findByIdAndUpdate(partyId, {
            totalUdharo: newBalance,
            lastTransactionDate: date
          });
        } catch (e) {}
      }

      const localCust = this.data.customers.find(c => c._id === partyId);
      if (localCust) {
        localCust.totalUdharo = newBalance;
        localCust.lastTransactionDate = date;
      }
    } else {
      let supp = null;
      if (getDBStatus().isConnected) {
        try {
          supp = await Supplier.findById(partyId);
        } catch (e) {}
      }
      if (!supp) {
        supp = this.data.suppliers.find(s => s._id === partyId);
      }
      if (!supp) throw new Error('साहू/सप्लायर फेला परेन (Supplier not found)');
      partyName = supp.name;

      const currentBal = supp.totalPayable || 0;
      if (entryType === 'PURCHASE_CREDIT') {
        newBalance = currentBal + numAmount;
      } else if (entryType === 'PAYMENT_MADE') {
        newBalance = currentBal - numAmount;
      } else {
        newBalance = currentBal;
      }

      if (getDBStatus().isConnected) {
        try {
          await Supplier.findByIdAndUpdate(partyId, {
            totalPayable: newBalance,
            lastTransactionDate: date
          });
        } catch (e) {}
      }

      const localSupp = this.data.suppliers.find(s => s._id === partyId);
      if (localSupp) {
        localSupp.totalPayable = newBalance;
        localSupp.lastTransactionDate = date;
      }
    }

    const ledger = {
      _id: 'led_' + Date.now() + '_' + Math.random().toString(36).substring(7),
      shopId,
      partyType,
      partyId,
      partyName,
      direction: partyType === 'Customer' ? 'RECEIVABLE' : 'PAYABLE',
      entryType,
      amount: numAmount,
      balanceAfter: newBalance,
      referenceSaleId: null,
      notes: notes || '',
      date
    };

    if (getDBStatus().isConnected) {
      try {
        await LedgerEntry.create(ledger);
      } catch (e) {}
    }

    this.data.ledgerEntries.unshift(ledger);
    this.persist();
    return ledger;
  }

  async getPartyLedger(shopId = DEFAULT_SHOP_ID, partyType, partyId) {
    if (getDBStatus().isConnected) {
      try {
        const list = await LedgerEntry.find({ shopId, partyType, partyId }).sort({ date: -1 }).lean();
        if (list && list.length > 0) return list;
      } catch (e) {}
    }
    return this.data.ledgerEntries.filter(l => l.partyType === partyType && l.partyId === partyId);
  }

  // Totals (हिसाब) with Nepal Timezone and non-double counting
  async getTotals(shopId = DEFAULT_SHOP_ID, period = 'today') {
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

    let allSales = [];
    let allLedger = [];
    let allCustomers = [];
    let allSuppliers = [];

    if (getDBStatus().isConnected) {
      try {
        const [sales, ledgers, custs, supps] = await Promise.all([
          Sale.find({ shopId, date: { $gte: startDate } }).sort({ date: -1 }).lean(),
          LedgerEntry.find({ shopId, date: { $gte: startDate } }).lean(),
          Customer.find({ shopId }).lean(),
          Supplier.find({ shopId }).lean()
        ]);
        allSales = sales || [];
        allLedger = ledgers || [];
        allCustomers = custs || [];
        allSuppliers = supps || [];
      } catch (e) {
        console.warn('Mongo getTotals fallback:', e.message);
      }
    }

    // Fallback to local memory if mongo returned empty or failed
    if (allSales.length === 0 && this.data.sales.length > 0) {
      const startISO = startDate.toISOString();
      allSales = this.data.sales.filter(s => s.date >= startISO);
      allLedger = this.data.ledgerEntries.filter(l => l.date >= startISO);
      allCustomers = this.data.customers;
      allSuppliers = this.data.suppliers;
    }

    const totalSales = allSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const cashSales = allSales.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const creditSales = allSales.filter(s => s.paymentType === 'credit').reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const transactionCount = allSales.length;

    // Collections of old credit: payments received in this period (separate from revenue!)
    const oldCreditCollections = allLedger
      .filter(l => l.entryType === 'PAYMENT_RECEIVED')
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    // Payments made to suppliers in this period
    const paymentsMadeToSuppliers = allLedger
      .filter(l => l.entryType === 'PAYMENT_MADE')
      .reduce((sum, l) => sum + (l.amount || 0), 0);

    // Total outstanding customer udharo across entire shop
    const totalCustomerUdharo = allCustomers.reduce((sum, c) => sum + (c.totalUdharo || 0), 0);
    // Total shop payable to suppliers
    const totalSupplierPayable = allSuppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);

    return {
      period,
      totalSales,
      transactionCount,
      cashSales,
      creditSales,
      oldCreditCollections,
      totalCashInDrawer: cashSales + oldCreditCollections - paymentsMadeToSuppliers,
      paymentsMadeToSuppliers,
      totalCustomerUdharo,
      totalSupplierPayable,
      transactions: allSales
    };
  }

  // Stock movements
  async getStockMovements(shopId = DEFAULT_SHOP_ID, limit = 50) {
    return this.data.stockMovements.slice(0, limit);
  }

  // OCR Batches
  async saveScanBatch(batchData) {
    const batch = {
      _id: 'batch_' + Date.now(),
      shopId: batchData.shopId || DEFAULT_SHOP_ID,
      imageUrl: batchData.imageUrl,
      extractedRecords: batchData.extractedRecords || [],
      totalRecords: (batchData.extractedRecords || []).length,
      importedCount: 0,
      isImported: false,
      createdAt: new Date().toISOString()
    };
    this.data.scanBatches.unshift(batch);
    this.persist();
    return batch;
  }

  async getScanBatches(shopId = DEFAULT_SHOP_ID) {
    return this.data.scanBatches;
  }

  async importApprovedScanRecords(shopId = DEFAULT_SHOP_ID, batchId, approvedRecords) {
    const batch = this.data.scanBatches.find(b => b._id === batchId);
    let imported = 0;

    for (const rec of approvedRecords) {
      if (rec.category === 'CUSTOMER_CREDIT' && rec.partyName && rec.amount > 0) {
        // Find or create customer
        let cust = this.data.customers.find(c => c.name.toLowerCase() === rec.partyName.toLowerCase());
        if (!cust) {
          cust = await this.createCustomer(shopId, {
            name: rec.partyName,
            phone: rec.phone || '',
            totalUdharo: 0
          });
        }
        await this.addUdharoEntry(shopId, {
          partyType: 'Customer',
          partyId: cust._id,
          amount: rec.amount,
          entryType: 'SALE_CREDIT',
          notes: rec.notes || `कागज स्क्यान मार्फत आयात (${rec.productName || 'सामान'})`
        });
        imported++;
      } else if (rec.category === 'CUSTOMER_PAYMENT' && rec.partyName && rec.amount > 0) {
        let cust = this.data.customers.find(c => c.name.toLowerCase() === rec.partyName.toLowerCase());
        if (!cust) {
          cust = await this.createCustomer(shopId, {
            name: rec.partyName,
            phone: rec.phone || '',
            totalUdharo: 0
          });
        }
        await this.addUdharoEntry(shopId, {
          partyType: 'Customer',
          partyId: cust._id,
          amount: rec.amount,
          entryType: 'PAYMENT_RECEIVED',
          notes: rec.notes || 'कागज स्क्यान मार्फत प्राप्त भुक्तानी'
        });
        imported++;
      } else if (rec.category === 'SALE_CASH' && rec.amount > 0) {
        await this.createSale(shopId, {
          items: [{ name: rec.productName || 'स्क्यान गरिएको सामान', quantity: rec.quantity || 1, unitPrice: rec.amount, lineTotal: rec.amount }],
          grandTotal: rec.amount,
          paymentType: 'cash',
          notes: 'कागज स्क्यान मार्फत नगद बिक्री'
        });
        imported++;
      }
    }

    if (batch) {
      batch.importedCount += imported;
      batch.isImported = true;
      this.persist();
    }

    return { importedCount: imported };
  }
}

export const store = new KiranaStore();

