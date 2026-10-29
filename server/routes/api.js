import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { store } from '../data/store.js';
import { 
  processKiranaDocument, 
  processProductPhoto, 
  processRackShelfPhoto 
} from '../services/ocrService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `scan_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === 'application/pdf';
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('तस्बिर वा PDF मात्र अपलोड गर्न सकिन्छ (Only image or PDF allowed)'));
  }
});

// 1. Shop profile
router.get('/shop', async (req, res) => {
  try {
    const shop = await store.getShop();
    res.json({ success: true, shop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/shop', async (req, res) => {
  try {
    const updated = await store.updateShop('shop_kirana_001', req.body);
    res.json({ success: true, shop: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'कृपया तस्बिर छान्नुहोस्' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Products
router.get('/products', async (req, res) => {
  try {
    const search = req.query.search || '';
    const products = await store.getProducts('shop_kirana_001', search);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, sellingPrice } = req.body;
    if (!name || sellingPrice === undefined) {
      return res.status(400).json({ success: false, error: 'सामानको नाम र मूल्य आवश्यक छ (Product name and price required)' });
    }
    const product = await store.createProduct('shop_kirana_001', req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/products/:id/adjust', async (req, res) => {
  try {
    const { delta, reason } = req.body;
    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({ success: false, error: 'फरक परिमाण आवश्यक छ (Valid delta required)' });
    }
    const result = await store.adjustStock('shop_kirana_001', req.params.id, Number(delta), reason);
    if (!result) {
      return res.status(404).json({ success: false, error: 'सामान फेला परेन' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Sales
router.get('/sales', async (req, res) => {
  try {
    const sales = await store.getSales('shop_kirana_001');
    res.json({ success: true, sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const { items, grandTotal, paymentType, customerId } = req.body;
    if (!items || !items.length || grandTotal === undefined) {
      return res.status(400).json({ success: false, error: 'सामानको विवरण र रकम आवश्यक छ (Items and grand total required)' });
    }
    if (paymentType === 'credit' && !customerId && !req.body.customerName) {
      return res.status(400).json({ success: false, error: 'उधारो बिक्रीको लागि ग्राहकको नाम चयन गर्नुहोस् (Select or enter customer for credit sale)' });
    }

    const sale = await store.createSale('shop_kirana_001', req.body);
    res.status(201).json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Customers (Receivables / उठाउन बाँकी)
router.get('/customers', async (req, res) => {
  try {
    const customers = await store.getCustomers('shop_kirana_001', req.query.search);
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'ग्राहकको नाम आवश्यक छ (Customer name required)' });
    }
    const customer = await store.createCustomer('shop_kirana_001', req.body);
    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Suppliers (Payables / तिर्न बाँकी)
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await store.getSuppliers('shop_kirana_001', req.query.search);
    res.json({ success: true, suppliers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'सप्लायरको नाम आवश्यक छ (Supplier name required)' });
    }
    const supplier = await store.createSupplier('shop_kirana_001', req.body);
    res.status(201).json({ success: true, supplier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Udharo & Payments (उधारो र भुक्तानी)
router.post('/udharo/entry', async (req, res) => {
  try {
    const { partyType, partyId, amount, entryType, notes } = req.body;
    if (!partyType || !partyId || !amount || !entryType) {
      return res.status(400).json({ success: false, error: 'सम्पूर्ण जानकारी भर्नुहोस् (Missing required fields)' });
    }
    const ledger = await store.addUdharoEntry('shop_kirana_001', { partyType, partyId, amount, entryType, notes });
    res.status(201).json({ success: true, ledger });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/udharo/ledger/:partyType/:partyId', async (req, res) => {
  try {
    const { partyType, partyId } = req.params;
    const history = await store.getPartyLedger('shop_kirana_001', partyType, partyId);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Totals (हिसाब)
router.get('/totals', async (req, res) => {
  try {
    const period = req.query.period || 'today';
    const totals = await store.getTotals('shop_kirana_001', period);
    res.json({ success: true, totals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Stock Movements (स्टक फेरबदल)
router.get('/stock/movements', async (req, res) => {
  try {
    const movements = await store.getStockMovements('shop_kirana_001');
    res.json({ success: true, movements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. OCR Scan Paper (कागज स्क्यान)
router.post('/ocr/scan', upload.single('image'), async (req, res) => {
  try {
    let filePath = '';
    let filename = 'camera_capture.jpg';
    let fileUrl = '/uploads/sample_receipt.jpg';

    if (req.file) {
      filePath = req.file.path;
      filename = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const ocrResult = await processKiranaDocument(filePath, filename);

    // Save batch for review
    const batch = await store.saveScanBatch({
      shopId: 'shop_kirana_001',
      imageUrl: fileUrl,
      extractedRecords: ocrResult.records
    });

    res.json({
      success: true,
      batchId: batch._id,
      imageUrl: fileUrl,
      records: ocrResult.records
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Single Product Photo Scan
router.post('/ocr/product-photo', upload.single('image'), async (req, res) => {
  try {
    let filePath = req.file ? req.file.path : '';
    let filename = req.file ? req.file.originalname : 'product.jpg';
    let fileUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/sample_product.jpg';

    const result = await processProductPhoto(filePath, filename);
    res.json({
      success: true,
      imageUrl: fileUrl,
      product: result.product
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Multi-product Rack / Shelf Photo Scan
router.post('/ocr/rack-photo', upload.single('image'), async (req, res) => {
  try {
    let filePath = req.file ? req.file.path : '';
    let filename = req.file ? req.file.originalname : 'rack.jpg';
    let fileUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/sample_rack.jpg';

    const result = await processRackShelfPhoto(filePath, filename);
    res.json({
      success: true,
      imageUrl: fileUrl,
      detectedCount: result.detectedCount,
      products: result.products
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch create or import products into inventory
router.post('/products/batch', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'सामान सूची आवश्यक छ' });
    }

    const createdList = [];
    for (const item of products) {
      if (item.name) {
        const prod = await store.createProduct('shop_kirana_001', {
          name: item.name,
          nameEn: item.nameEn || '',
          sellingPrice: Number(item.sellingPrice) || 0,
          costPrice: Number(item.costPrice) || 0,
          stockQty: Number(item.stockQty) || 0,
          unit: item.unit || 'थान',
          category: item.category || 'किराना'
        });
        createdList.push(prod);
      }
    }

    res.json({
      success: true,
      count: createdList.length,
      products: createdList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ocr/import', async (req, res) => {
  try {
    const { batchId, approvedRecords } = req.body;
    if (!batchId || !approvedRecords || !Array.isArray(approvedRecords)) {
      return res.status(400).json({ success: false, error: 'स्वीकृत रेकर्ड आवश्यक छ (Approved records required)' });
    }
    const result = await store.importApprovedScanRecords('shop_kirana_001', batchId, approvedRecords);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

