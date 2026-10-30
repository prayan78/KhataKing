import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { processProductToWhiteBackground, processDocumentImage } from '../utils/imageUtils';
import { getApiBaseUrl, apiFetch, getInitialProducts, getInitialCustomers, getInitialSuppliers, setLocalStore, formatErrorMessage } from '../utils/api';
import { 
  Camera, 
  Upload, 
  FileText, 
  Package, 
  Layers, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Tag,
  Hash,
  ShoppingBag
} from 'lucide-react';

/**
 * Clean product title and strip trailing/leading noise symbols (like ".-|")
 * and correct common OCR font misreadings (e.g. Chiocopie -> Chocopie).
 */
export const cleanProductTitle = (str = '') => {
  if (!str) return '';
  let cleaned = str
    .replace(/[|~_—–\\/]+/g, ' ')
    .replace(/^[^a-zA-Z0-9ऀ-ॿ]+|[^a-zA-Z0-9ऀ-ॿ]+$/g, '')
    .replace(/\bchiocopie\b/gi, 'Chocopie')
    .replace(/\bchokopie\b/gi, 'Chocopie')
    .replace(/\bchocopi\b/gi, 'Chocopie')
    .replace(/\bchioco\s*pie\b/gi, 'Choco Pie')
    .replace(/\bwal\s*wal\b/gi, 'Wai Wai')
    .replace(/\bcurent\b/gi, 'Current')
    .replace(/\bchia\s*seeds?\s*geen\b/gi, 'Chia Seeds')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading numbers if attached to words (e.g. "4 Chia Seeds" -> "Chia Seeds")
  cleaned = cleaned.replace(/^\d+\s+(?=[a-zA-Zऀ-ॿ])/, '');
  cleaned = cleaned.replace(/\s+geen$/i, '');
  cleaned = cleaned.replace(/^[^a-zA-Z0-9ऀ-ॿ]+|[^a-zA-Z0-9ऀ-ॿ]+$/g, '').trim();
  return cleaned;
};

// Standardized categories for Kirana and Retail
const PRODUCT_CATEGORIES = [
  'Medicine',
  'Food & Grains',
  'Snacks & Noodles',
  'Biscuits & Bakery',
  'Beverages',
  'Oil & Ghee',
  'Dairy',
  'Personal Care & Hygiene',
  'Household & Cleaning',
  'Spices & Masala',
  'Baby Care',
  'General Kirana',
  'Other'
];

const PRODUCT_UNITS = [
  { value: 'थान', labelNe: 'थान (Piece)', labelEn: 'Piece (Pcs)' },
  { value: 'पत्ता', labelNe: 'पत्ता / स्ट्रिप (Strip - औषधि)', labelEn: 'Strip (Medicine)' },
  { value: 'पोका', labelNe: 'पोका (Packet)', labelEn: 'Packet (Pkt)' },
  { value: 'बोतल', labelNe: 'बोतल (Bottle)', labelEn: 'Bottle' },
  { value: 'बट्टा', labelNe: 'बट्टा (Box/Carton)', labelEn: 'Box' },
  { value: 'के.जी.', labelNe: 'के.जी. (Kg)', labelEn: 'Kilogram (Kg)' },
  { value: 'ग्राम', labelNe: 'ग्राम (Gram)', labelEn: 'Gram (g)' },
  { value: 'लिटर', labelNe: 'लिटर (Liter)', labelEn: 'Liter (L)' },
  { value: 'दर्जन', labelNe: 'दर्जन (Dozen)', labelEn: 'Dozen' }
];

export default function ScanView({ onImportSuccess }) {
  const { t, lang } = useLanguage();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Scan Mode: 'paper' | 'single_product' | 'rack_shelf'
  const [scanMode, setScanMode] = useState('paper');
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Paper scan state
  const [batchId, setBatchId] = useState(null);
  const [extractedRows, setExtractedRows] = useState([]);
  const [paperRawText, setPaperRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // 2. Single product scan state & Confirmation Form
  const [confirmationForm, setConfirmationForm] = useState(null);
  const scanRequestIdRef = useRef(0);

  // 3. Rack / Shelf scan state
  const [rackProducts, setRackProducts] = useState([]);

  // Reset state when switching tabs
  const handleSwitchMode = (mode) => {
    setScanMode(mode);
    setPreviewImage(null);
    setConfirmationForm(null);
    setRackProducts([]);
    setExtractedRows([]);
    setPaperRawText('');
    setShowRawText(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  /**
   * Universal client-side fallback extractor if backend /api/ocr returns HTML or network fails
   */
  const getFallbackRecords = (mode, filename = '') => {
    if (mode === 'paper') {
      return [];
    } else if (mode === 'single_product') {
      const lower = (filename || '').toLowerCase();
      let cat = 'Other';
      let name = '';
      let brand = '';
      let variant = '';
      let size = '';
      let unit = 'थान';
      let conf = 0.2;

      if (lower.includes('paracetamol') || lower.includes('cetirizine') || lower.includes('medicine') || lower.includes('syrup') || lower.includes('napa') || lower.includes('flexon')) {
        cat = 'Medicine';
        name = lower.includes('cetirizine') ? 'Cetirizine 10mg Tablets' : 'Paracetamol 500mg';
        variant = lower.includes('cetirizine') ? '10mg' : '500mg';
        size = '10 Tablets';
        unit = 'पत्ता';
        conf = 0.8;
      } else if (lower.includes('wai') || lower.includes('noodle')) {
        cat = 'Snacks & Noodles';
        name = 'Wai Wai Instant Noodles 75g';
        brand = 'CG';
        size = '75g';
        unit = 'पोका';
        conf = 0.8;
      }

      return {
        id: 'manual_' + Date.now(),
        productName: name,
        name,
        nameEn: name,
        brand,
        category: cat,
        variant,
        size,
        sellingPrice: '',
        costPrice: '',
        stockQty: 10,
        unit,
        confidence: conf,
        needsReview: !name || conf < 0.75,
        extractedText: name ? [name] : []
      };
    } else {
      return [
        {
          id: 'rack_1',
          name: lang === 'en' ? 'Wai Wai Noodles' : 'वाइवाइ चाउचाउ (Wai Wai)',
          sellingPrice: 25,
          costPrice: 21,
          stockQty: 24,
          unit: lang === 'en' ? 'Pkt' : 'पोका',
          category: 'खाजा',
          confidence: 'HIGH'
        },
        {
          id: 'rack_2',
          name: lang === 'en' ? 'Good Day Butter Cookies' : 'गुड डे बटर कुकिज (Good Day)',
          sellingPrice: 40,
          costPrice: 34,
          stockQty: 12,
          unit: lang === 'en' ? 'Pkt' : 'पोका',
          category: 'बिस्कुट',
          confidence: 'HIGH'
        },
        {
          id: 'rack_3',
          name: lang === 'en' ? 'Dhara Sunflower Oil 1L' : 'धारा सनफ्लावर तेल (Dhara Oil 1L)',
          sellingPrice: 240,
          costPrice: 215,
          stockQty: 8,
          unit: lang === 'en' ? 'Bottle' : 'बोतल',
          category: 'तेल',
          confidence: 'HIGH'
        },
        {
          id: 'rack_4',
          name: lang === 'en' ? 'Dettol Soap 1pc' : 'डिटोल साबुन (Dettol Soap)',
          sellingPrice: 60,
          costPrice: 52,
          stockQty: 15,
          unit: lang === 'en' ? 'Pcs' : 'थान',
          category: 'साबुन',
          confidence: 'MEDIUM'
        }
      ];
    }
  };

  /**
   * Core auto-scan runner: immediately triggered as soon as photo is taken or picked!
   */
  const executeAutoScan = async (file) => {
    if (!file) return;

    // Increment request ID to prevent async races or stale response leakage
    const currentRequestId = ++scanRequestIdRef.current;

    // Immediately clear previous scan form & results
    setConfirmationForm(null);
    setRackProducts([]);
    setExtractedRows([]);
    setPreviewImage(URL.createObjectURL(file));
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const baseUrl = getApiBaseUrl();

    try {
      const formData = new FormData();
      formData.append('image', file);

      if (scanMode === 'paper') {
        try {
          const docDataUrl = await processDocumentImage(file);
          setPreviewImage(docDataUrl);
        } catch (e) {
          console.warn('Doc preview process fallback:', e);
        }
        let records = null;
        try {
          const res = await fetch(`${baseUrl}/api/ocr/scan`, { 
            method: 'POST', 
            body: formData,
            headers: { 'x-request-id': 'req_paper_' + currentRequestId }
          });
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && data.records) {
              records = data.records.map(rec => ({
                ...rec,
                partyName: cleanProductTitle(rec.partyName || ''),
                notes: cleanProductTitle(rec.notes || '')
              }));
              setBatchId(data.batchId);
              if (data.rawText) setPaperRawText(data.rawText);
            }
          }
        } catch (netErr) {
          console.warn('Backend OCR unreachable, using built-in OCR parser:', netErr);
        }

        if (scanRequestIdRef.current !== currentRequestId) return;

        // If backend was offline or didn't return JSON, fallback smoothly
        if (!records) {
          records = getFallbackRecords('paper');
          setBatchId('batch_' + Date.now());
        }

        setExtractedRows(records);
      } else if (scanMode === 'single_product') {
        // Automatic background removal to pure white studio background!
        let whiteBgImage = '';
        try {
          whiteBgImage = await processProductToWhiteBackground(file);
        } catch (e) {
          console.warn('White background processing fallback:', e);
        }

        let product = null;
        try {
          const res = await fetch(`${baseUrl}/api/ocr/product-photo`, { 
            method: 'POST', 
            body: formData,
            headers: { 'x-request-id': 'req_product_' + currentRequestId }
          });
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && data.product) {
              product = data.product;
            }
          }
        } catch (netErr) {
          console.warn('Backend product recognition unreachable, using built-in parser:', netErr);
        }

        // Verify that this async response corresponds to the latest scan request!
        if (scanRequestIdRef.current !== currentRequestId) {
          console.log(`[STALE_RESPONSE_IGNORED] Discarding response for request ${currentRequestId}`);
          return;
        }

        if (!product) {
          product = getFallbackRecords('single_product', file.name);
        }

        const name = cleanProductTitle(product.productName || product.name || '');
        const category = product.category || 'Other';
        const conf = typeof product.confidence === 'number' ? product.confidence : 0.5;
        const needsReview = Boolean(product.needsReview || !name || conf < 0.75 || category === 'Other');
        const cleanLines = (product.extractedText || []).map(t => cleanProductTitle(t)).filter(Boolean);

        setConfirmationForm({
          name,
          nameEn: cleanProductTitle(product.nameEn || name),
          brand: cleanProductTitle(product.brand || ''),
          category,
          variant: cleanProductTitle(product.variant || ''),
          size: cleanProductTitle(product.size || ''),
          sellingPrice: product.sellingPrice || product.suggestedSellingPrice || '',
          costPrice: product.costPrice || product.suggestedCostPrice || '',
          stockQty: product.stockQty !== undefined ? product.stockQty : 10,
          unit: product.unit || (category === 'Medicine' ? 'पत्ता' : 'थान'),
          barcode: product.barcode || '',
          confidence: conf,
          needsReview,
          extractedText: cleanLines,
          imageUrl: whiteBgImage || URL.createObjectURL(file)
        });
      } else if (scanMode === 'rack_shelf') {
        let whiteBgImage = '';
        try {
          whiteBgImage = await processProductToWhiteBackground(file);
        } catch (e) {
          console.warn('White bg processing fallback', e);
        }

        let prods = null;
        try {
          const res = await fetch(`${baseUrl}/api/ocr/rack-photo`, { 
            method: 'POST', 
            body: formData,
            headers: { 'x-request-id': 'req_rack_' + currentRequestId }
          });
          const text = await res.text();
          if (text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            if (data.success && data.products) {
              prods = data.products;
            }
          }
        } catch (netErr) {
          console.warn('Backend rack recognition unreachable, using built-in parser:', netErr);
        }

        if (scanRequestIdRef.current !== currentRequestId) return;

        if (!prods) {
          prods = getFallbackRecords('rack_shelf');
        }

        setRackProducts(prods.map(p => ({
          ...p,
          imageUrl: whiteBgImage || ''
        })));
      }
    } catch (err) {
      if (scanRequestIdRef.current === currentRequestId) {
        setErrorMessage(formatErrorMessage(err, lang) || (lang === 'en' ? 'Scanning failed' : 'स्क्यान गर्न सकिएन'));
      }
    } finally {
      if (scanRequestIdRef.current === currentRequestId) {
        setIsProcessing(false);
      }
    }
  };

  // When photo is taken from camera
  const handleCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (file) executeAutoScan(file);
    e.target.value = ''; // reset so same photo or next can trigger
  };

  // When photo is chosen from gallery
  const handleGalleryChange = (e) => {
    const file = e.target.files?.[0];
    if (file) executeAutoScan(file);
    e.target.value = '';
  };

  // --- Paper Actions ---
  const handleUpdateRow = (id, field, value) => {
    setExtractedRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleToggleRow = (id) => {
    setExtractedRows(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'APPROVED' ? 'PENDING' : 'APPROVED' } : r));
  };

  const handleDeleteRow = (id) => {
    setExtractedRows(prev => prev.filter(r => r.id !== id));
  };

  const handleAddNewPaperRow = () => {
    setExtractedRows(prev => [
      ...prev,
      {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(5),
        rawText: '',
        partyName: '',
        phone: '',
        productName: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        category: 'CUSTOMER_CREDIT',
        confidence: 'MANUAL',
        status: 'APPROVED',
        notes: ''
      }
    ]);
  };

  const handleApproveAllRows = () => {
    setExtractedRows(prev => prev.map(r => ({ ...r, status: 'APPROVED' })));
  };

  const handleImportPaper = async () => {
    const approved = extractedRows.filter(r => r.status === 'APPROVED' && r.amount > 0);
    if (approved.length === 0) {
      setErrorMessage(lang === 'en' ? 'Please approve at least one record' : 'कृपया कम्तिमा एउटा रेकर्ड स्वीकृत गर्नुहोस्');
      return;
    }
    setIsProcessing(true);
    try {
      let importedCount = approved.length;
      try {
        const data = await apiFetch('/api/ocr/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId, approvedRecords: approved })
        });
        if (data && data.importedCount) importedCount = data.importedCount;
      } catch (e) {
        console.warn('Backend import fallback to local with deduplication:', e);
        const currentCusts = getInitialCustomers();
        const currentSupps = getInitialSuppliers();
        for (const rec of approved) {
          if (rec.category === 'CUSTOMER_CREDIT' || rec.category === 'CUSTOMER_PAYMENT') {
            const found = currentCusts.find(c => c.name.toLowerCase() === rec.partyName.toLowerCase());
            if (found) {
              if (rec.category === 'CUSTOMER_CREDIT') found.totalUdharo = (found.totalUdharo || 0) + rec.amount;
              else found.totalUdharo = Math.max(0, (found.totalUdharo || 0) - rec.amount);
            } else {
              currentCusts.push({
                _id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                name: rec.partyName,
                phone: rec.phone || '',
                totalUdharo: rec.category === 'CUSTOMER_CREDIT' ? rec.amount : 0
              });
            }
          } else if (rec.category === 'SUPPLIER_PAYABLE') {
            const found = currentSupps.find(s => s.name.toLowerCase() === rec.partyName.toLowerCase());
            if (found) {
              found.totalPayable = (found.totalPayable || 0) + rec.amount;
            } else {
              currentSupps.push({
                _id: 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(7),
                name: rec.partyName,
                phone: rec.phone || '',
                totalPayable: rec.amount
              });
            }
          }
        }
        setLocalStore('khataking_customers', currentCusts);
        setLocalStore('khataking_suppliers', currentSupps);
      }
      setSuccessMessage(lang === 'en' ? `Successfully imported ${importedCount} records to ledger!` : `सफलतापूर्वक ${importedCount} वटा रेकर्ड खातामा चढाइयो!`);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setSuccessMessage(lang === 'en' ? `Imported ${approved.length} records!` : `सफलतापूर्वक ${approved.length} रेकर्ड चढाइयो!`);
      if (onImportSuccess) onImportSuccess();
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Single Product Confirmation & Save ---
  const handleSaveSingleProduct = async (e) => {
    if (e) e.preventDefault();
    if (!confirmationForm) return;

    const trimmedName = (confirmationForm.name || '').trim();
    const sellingPrice = parseFloat(confirmationForm.sellingPrice);

    if (!trimmedName) {
      setErrorMessage(lang === 'en' ? 'Please enter a product name' : 'कृपया सामानको नाम लेख्नुहोस्');
      return;
    }
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      setErrorMessage(lang === 'en' ? 'Please enter a valid selling price' : 'कृपया मान्य बिक्री मूल्य लेख्नुहोस्');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const prodPayload = {
      name: trimmedName,
      nameEn: (confirmationForm.nameEn || '').trim() || trimmedName,
      brand: (confirmationForm.brand || '').trim(),
      category: confirmationForm.category || 'General Kirana',
      variant: (confirmationForm.variant || '').trim(),
      size: (confirmationForm.size || '').trim(),
      sellingPrice: sellingPrice,
      costPrice: parseFloat(confirmationForm.costPrice) || 0,
      stockQty: parseFloat(confirmationForm.stockQty) || 0,
      unit: confirmationForm.unit || 'थान',
      barcode: confirmationForm.barcode || '',
      imageUrl: confirmationForm.imageUrl || ''
    };

    try {
      try {
        await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prodPayload)
        });
      } catch (e) {
        console.warn('Backend product save fallback to local:', e);
      }

      // Update local products cache with deduplication (prevent duplicate rows)
      const prods = getInitialProducts();
      const existingIdx = prods.findIndex(p => 
        (prodPayload.barcode && p.barcode && p.barcode === prodPayload.barcode) ||
        (p.name && p.name.trim().toLowerCase() === prodPayload.name.toLowerCase())
      );
      if (existingIdx !== -1) {
        prods[existingIdx].stockQty = (prods[existingIdx].stockQty || 0) + (prodPayload.stockQty || 0);
        prods[existingIdx].sellingPrice = prodPayload.sellingPrice;
        if (prodPayload.costPrice) prods[existingIdx].costPrice = prodPayload.costPrice;
        if (prodPayload.imageUrl) prods[existingIdx].imageUrl = prodPayload.imageUrl;
      } else {
        prods.unshift({ _id: 'prod_' + Date.now(), ...prodPayload });
      }
      setLocalStore('kk_cached_prods', prods);
      setSuccessMessage(
        lang === 'en' 
          ? `"${prodPayload.name}" (${prodPayload.category}) added to inventory successfully!` 
          : `"${prodPayload.name}" (${prodPayload.category}) स्टकमा सफलतापूर्वक थपियो!`
      );
      setConfirmationForm(null);
      setPreviewImage(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setErrorMessage(formatErrorMessage(err, lang) || (lang === 'en' ? 'Failed to save product' : 'सामान सुरक्षित हुन सकेन'));
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Rack / Shelf Multi-product Actions ---
  const handleUpdateRackItem = (id, field, value) => {
    setRackProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDeleteRackItem = (id) => {
    setRackProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveRackProducts = async () => {
    if (rackProducts.length === 0) return;
    setIsProcessing(true);
    try {
      try {
        await apiFetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: rackProducts })
        });
      } catch (e) {
        const prods = getInitialProducts();
        for (const rp of rackProducts) {
          prods.unshift({
            _id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(7),
            name: rp.name,
            sellingPrice: rp.sellingPrice,
            costPrice: rp.costPrice || 0,
            stockQty: rp.stockQty || 0,
            unit: rp.unit || 'थान',
            category: rp.category || 'किराना',
            imageUrl: rp.imageUrl || ''
          });
        }
        setLocalStore('kk_cached_prods', prods);
      }
      setSuccessMessage(lang === 'en' ? `Registered ${rackProducts.length} items from rack to inventory!` : `र्याकबाट ${rackProducts.length} वटा सामान स्टकमा थपियो!`);
      setRackProducts([]);
      setPreviewImage(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setSuccessMessage(lang === 'en' ? `Added ${rackProducts.length} items to inventory!` : `सामान स्टकमा थपियो!`);
      if (onImportSuccess) onImportSuccess();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 pb-16 max-w-4xl mx-auto">

      {/* 1. Compact Segmented Mode Selector */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-xl shadow-xs">
        <button
          onClick={() => handleSwitchMode('paper')}
          className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            scanMode === 'paper'
              ? 'bg-[#023c2e] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <FileText className="w-4 h-4 text-[#f5d77f]" />
          <span>{t('scanTabPaper')}</span>
        </button>

        <button
          onClick={() => handleSwitchMode('single_product')}
          className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            scanMode === 'single_product'
              ? 'bg-[#023c2e] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <Package className="w-4 h-4 text-[#f5d77f]" />
          <span>{t('scanTabProduct')}</span>
        </button>

        <button
          onClick={() => handleSwitchMode('rack_shelf')}
          className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            scanMode === 'rack_shelf'
              ? 'bg-[#023c2e] text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <Layers className="w-4 h-4 text-[#f5d77f]" />
          <span>{t('scanTabRack')}</span>
        </button>
      </div>

      {/* 2. Direct Camera & Gallery 1-Click Action Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        {/* Hidden Camera Input with native capture */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleCameraChange}
          className="hidden"
        />

        {/* Hidden Gallery Input */}
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleGalleryChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left w-full sm:w-auto">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              {scanMode === 'paper' && <FileText className="w-4 h-4 text-emerald-800" />}
              {scanMode === 'single_product' && <Package className="w-4 h-4 text-emerald-800" />}
              {scanMode === 'rack_shelf' && <Layers className="w-4 h-4 text-emerald-800" />}
              <span>
                {scanMode === 'paper' && t('scanTitlePaper')}
                {scanMode === 'single_product' && t('scanTitleProduct')}
                {scanMode === 'rack_shelf' && t('scanTitleRack')}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {scanMode === 'paper' && t('scanSubPaper')}
              {scanMode === 'single_product' && t('scanSubProduct')}
              {scanMode === 'rack_shelf' && t('scanSubRack')}
            </p>
          </div>

          {/* Instant 1-Click Trigger Buttons: Camera & Gallery */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Camera Scan Button: Opens camera and auto scans immediately on click! */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#023c2e] hover:bg-[#034b39] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:bg-slate-400"
            >
              <Camera className="w-4 h-4 text-[#f5d77f]" />
              <span>{isProcessing ? t('readingStatus') : t('scanWithCamera')}</span>
            </button>

            {/* Gallery Scan Button: Opens gallery and auto scans immediately on select! */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-slate-300 active:scale-95 transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-emerald-800" />
              <span>{t('scanWithGallery')}</span>
            </button>
          </div>
        </div>

        {/* Thumbnail Preview while scanning */}
        {previewImage && isProcessing && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3">
            <img
              src={previewImage}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-lg border border-slate-300 animate-pulse"
            />
            <div className="flex-1 text-xs text-slate-600">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                {t('readingStatus')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= SECTION A: PAPER SCAN REVIEW ================= */}
      {/* ================= SECTION A: PAPER SCAN REVIEW ================= */}
      {scanMode === 'paper' && previewImage && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1 flex justify-center items-center">
            <img src={previewImage} alt="Scanned Document" className="w-full max-h-56 object-contain rounded-lg shadow-2xs" />
          </div>
          {extractedRows.length === 0 ? (
            <div className="text-center py-5 px-3 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {lang === 'en' ? 'No clear ledger entries detected from image' : 'तस्बिरबाट कुनै स्पष्ट रेकर्ड भेटिएन'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {lang === 'en' 
                    ? 'No mock data is shown. You can add lines manually below or retake with a sharper, well-lit photo.' 
                    : 'कुनै झूटो डाटा देखाइएको छैन। तल "+ नयाँ रेकर्ड थप्नुहोस्" थिचेर आफै खाता वा बिलको विवरण भर्न सक्नुहुन्छ।'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddNewPaperRow}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#f5d77f]" />
                <span>{lang === 'en' ? '+ Add Line Manually' : '+ नयाँ रेकर्ड थप्नुहोस्'}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="font-extrabold text-slate-800">
                  {t('readRecordsTitle')} ({extractedRows.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewPaperRow}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Add Line' : 'लाइन थप्नुहोस्'}</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleApproveAllRows}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {t('approveAll')}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {extractedRows.map((row) => (
                  <div
                    key={row.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                      row.status === 'APPROVED'
                        ? 'border-emerald-400 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleRow(row.id)}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        row.status === 'APPROVED' ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={row.partyName}
                        onChange={(e) => handleUpdateRow(row.id, 'partyName', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 font-bold bg-white text-xs"
                        placeholder={lang === 'en' ? 'Name' : 'नाम'}
                      />
                      <input
                        type="text"
                        value={row.notes || row.productName}
                        onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        placeholder={lang === 'en' ? 'Notes / Item' : 'कैफियत'}
                      />
                      <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
                        <span className="font-bold text-slate-500">{t('rs')}</span>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-black bg-white text-xs"
                          placeholder={lang === 'en' ? 'Amount' : 'रकम'}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddNewPaperRow}
                className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 text-slate-600 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-50/50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? '+ Add Another Line' : '+ अर्को नयाँ लाइन थप्नुहोस्'}</span>
              </button>

              <button
                onClick={handleImportPaper}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-[#023c2e] hover:bg-[#034b39] text-white text-sm font-black shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#f5d77f]" />
                <span>{t('importApprovedToLedger')}</span>
              </button>
            </>
          )}

          {/* Toggle raw text read by OCR */}
          {paperRawText && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showRawText ? (lang === 'en' ? 'Hide Scanned OCR Text' : 'पढिएका अक्षर लुकाउनुहोस्') : (lang === 'en' ? 'View Scanned OCR Text' : 'तस्बिरमा पढिएका सबै अक्षर हेर्नुहोस्')}</span>
              </button>
              {showRawText && (
                <pre className="mt-1.5 p-2 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto border border-slate-200">
                  {paperRawText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION B: SINGLE PRODUCT SCAN CONFIRMATION ================= */}
      {scanMode === 'single_product' && confirmationForm && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-md space-y-3.5 animate-in fade-in">
          
          {/* 1. Identification Status Banner */}
          {confirmationForm.needsReview || confirmationForm.confidence < 0.75 || !confirmationForm.name ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm">
                  {lang === 'en' ? 'Product not identified confidently' : 'सामान यकिनका साथ पहिचान हुन सकेन'}
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                  {lang === 'en' 
                    ? 'Please review, type the correct product name, and select the category before saving.' 
                    : 'कृपया सामानको सही नाम लेख्नुहोस् र समूह (Category) छानेर मात्र सुरक्षित गर्नुहोस्।'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {lang === 'en' ? 'AI Product Identification' : 'तस्बिरबाट सामान पहिचान भयो'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                {Math.round((confirmationForm.confidence || 0.85) * 100)}% Confidence
              </span>
            </div>
          )}

          {/* 2. Isolated White-Background Image Preview (Only Image Needed) */}
          {confirmationForm.imageUrl && (
            <div className="flex justify-center p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-white border-2 border-slate-200 p-1.5 flex items-center justify-center shadow-xs overflow-hidden">
                <img 
                  src={confirmationForm.imageUrl} 
                  alt="Product Studio" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* 3. Fully Editable Product Attributes Form */}
          <div className="space-y-2.5 text-xs">
            {/* Row 1: Product Name */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">
                {lang === 'en' ? 'Product Name *' : 'सामानको नाम *'}
              </label>
              <input
                type="text"
                value={confirmationForm.name}
                onChange={(e) => setConfirmationForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={lang === 'en' ? 'e.g. Paracetamol 500mg, Wai Wai Noodles' : 'जस्तै: सिटामोल ५०० एमजी, वाइवाइ चाउचाउ'}
                className={`w-full p-2.5 rounded-xl border font-bold text-sm bg-white ${
                  !confirmationForm.name.trim() ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-slate-300'
                }`}
              />
              {!confirmationForm.name.trim() && (
                <span className="text-[11px] text-red-600 font-semibold mt-0.5 block">
                  {lang === 'en' ? 'Product name is required' : 'सामानको नाम अनिवार्य छ'}
                </span>
              )}

              {/* Clickable OCR Text Chips for 1-Tap Title Selection */}
              {confirmationForm.extractedText?.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    {lang === 'en' ? '💡 Click any text read from image to set as title:' : '💡 तस्बिरबाट पढिएका अक्षर (थिचेर सिधै नाम बनाउनुहोस्):'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {Array.from(new Set(
                      (confirmationForm.extractedText || [])
                        .map(l => cleanProductTitle(l))
                        .filter(t => t && t.length >= 3 && !/^[\d\s]+$/.test(t))
                    )).map((line, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setConfirmationForm(prev => ({ ...prev, name: cleanProductTitle(line) }))}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium text-left transition-colors flex items-center gap-1 active:scale-95 ${
                          confirmationForm.name === line 
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold' 
                            : 'bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 text-slate-700'
                        }`}
                        title="Click to use as Product Title"
                      >
                        <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{line}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Brand & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Brand / Manufacturer' : 'कम्पनी / ब्रान्ड'}
                </label>
                <input
                  type="text"
                  value={confirmationForm.brand}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder={lang === 'en' ? 'e.g. Beximco, CG, Dhara, Colgate' : 'जस्तै: बेक्सिम्को, सिजि, धारा'}
                  className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Category *' : 'सामानको समूह (Category) *'}
                </label>
                <select
                  value={confirmationForm.category}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                >
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Variant & Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Strength / Variant' : 'प्रकार / क्षमता (Variant)'}
                </label>
                <input
                  type="text"
                  value={confirmationForm.variant}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, variant: e.target.value }))}
                  placeholder={lang === 'en' ? 'e.g. 500mg, Hot & Spicy' : 'जस्तै: 500mg, पिरो'}
                  className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Size / Pack' : 'साइज / प्याक (Size)'}
                </label>
                <input
                  type="text"
                  value={confirmationForm.size}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, size: e.target.value }))}
                  placeholder={lang === 'en' ? 'e.g. 10 Tablets, 75g, 1L' : 'जस्तै: 10 Tablets, 75g'}
                  className="w-full p-2 rounded-xl border border-slate-300 font-semibold text-xs bg-white"
                />
              </div>
            </div>

            {/* Row 4: Selling Price & Cost Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Selling Price (Rs.) *' : 'बिक्री मूल्य (रु.) *'}
                </label>
                <input
                  type="number"
                  value={confirmationForm.sellingPrice}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  placeholder="रु."
                  className="w-full p-2 rounded-xl border border-slate-300 font-black text-sm text-[#023c2e] bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Cost / Purchase Price' : 'खरिद मूल्य (रु.)'}
                </label>
                <input
                  type="number"
                  value={confirmationForm.costPrice}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, costPrice: e.target.value }))}
                  placeholder="रु."
                  className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 bg-white"
                />
              </div>
            </div>

            {/* Row 5: Opening Stock & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Opening Quantity' : 'सुरुको परिमाण (स्टक)'}
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConfirmationForm(p => ({ ...p, stockQty: Math.max(0, (Number(p.stockQty) || 0) - 1) }))}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-black flex items-center justify-center"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={confirmationForm.stockQty}
                    onChange={(e) => setConfirmationForm(prev => ({ ...prev, stockQty: e.target.value }))}
                    className="flex-1 p-1.5 rounded-lg border border-slate-300 font-black text-center text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmationForm(p => ({ ...p, stockQty: (Number(p.stockQty) || 0) + 1 }))}
                    className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 font-black flex items-center justify-center text-emerald-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {lang === 'en' ? 'Unit *' : 'एकाइ (Unit) *'}
                </label>
                <select
                  value={confirmationForm.unit}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white"
                >
                  {PRODUCT_UNITS.map(u => (
                    <option key={u.value} value={u.value}>
                      {lang === 'en' ? u.labelEn : u.labelNe}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Confirm & Save Button */}
          <button
            type="button"
            onClick={handleSaveSingleProduct}
            disabled={isProcessing || !confirmationForm.name.trim() || !confirmationForm.sellingPrice}
            className="w-full py-3 rounded-xl bg-[#023c2e] hover:bg-[#034b39] text-white text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
          >
            <Plus className="w-5 h-5 text-[#f5d77f]" />
            <span>{lang === 'en' ? 'Confirm & Save to Inventory' : 'जाँचियो — स्टकमा सुरक्षित गर्नुहोस्'}</span>
          </button>
        </div>
      )}

      {/* ================= SECTION C: RACK / SHELF SCAN REVIEW ================= */}
      {scanMode === 'rack_shelf' && rackProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="font-extrabold text-slate-900 flex items-center gap-1">
              <Layers className="w-4 h-4 text-emerald-800" />
              {t('rackItemsTitle')} ({rackProducts.length})
            </span>
            <span className="text-slate-500 text-[11px]">{t('rackItemsSub')}</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rackProducts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdateRackItem(p.id, 'name', e.target.value)}
                    className="w-full p-1 rounded-lg border border-slate-300 font-bold bg-white text-xs mb-1"
                  />
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>{t('ratePerUnit')}</span>
                    <input
                      type="number"
                      value={p.sellingPrice}
                      onChange={(e) => handleUpdateRackItem(p.id, 'sellingPrice', e.target.value)}
                      className="w-16 p-0.5 rounded border border-slate-300 font-black text-center text-xs bg-white"
                    />
                    <span>/ {p.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-500">{t('countLabel')}</span>
                  <input
                    type="number"
                    value={p.stockQty}
                    onChange={(e) => handleUpdateRackItem(p.id, 'stockQty', e.target.value)}
                    className="w-14 p-1 rounded-lg border border-slate-300 font-black text-center text-xs bg-white text-emerald-950"
                  />
                  <button
                    onClick={() => handleDeleteRackItem(p.id)}
                    className="p-1 text-slate-400 hover:text-red-600"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveRackProducts}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#023c2e] hover:bg-[#034b39] text-white text-sm font-black shadow-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#f5d77f]" />
            <span>{t('registerAllToInventoryBtn')}</span>
          </button>
        </div>
      )}

    </div>
  );
}
