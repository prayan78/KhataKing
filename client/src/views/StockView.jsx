import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { processProductToWhiteBackground } from '../utils/imageUtils';
import { apiFetch, getInitialProducts, setLocalStore, formatErrorMessage } from '../utils/api';
import { 
  Package, 
  Plus, 
  Minus,
  Search, 
  AlertTriangle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Camera,
  Upload,
  Sparkles,
  X,
  AlertCircle,
  Eye
} from 'lucide-react';

export default function StockView({ products, onRefreshProducts }) {
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals: 'add_product' | 'adjust_stock' | 'stock_history'
  const [modalType, setModalType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [movements, setMovements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  // Form states
  const [prodForm, setProdForm] = useState({
    name: '',
    nameEn: '',
    sellingPrice: '',
    costPrice: '',
    stockQty: '',
    unit: 'थान',
    minStockAlert: '5',
    category: 'किराना',
    imageUrl: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    delta: '',
    type: 'add', // 'add' | 'reduce'
    reason: 'थप खरिद'
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common units in Nepali Kirana
  const units = ['थान', 'पोका', 'के.जी.', 'ग्राम', 'लिटर', 'बोतल', 'दर्जन', 'क्रेट'];

  // Filter products
  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q))
    );
  });

  // Open stock movement history
  const handleOpenHistory = async () => {
    setModalType('stock_history');
    setHistoryLoading(true);
    try {
      const data = await apiFetch('/api/stock/movements');
      if (data && data.success) {
        setMovements(data.movements || []);
      }
    } catch (e) {
      console.warn('Could not load movements from server:', e);
      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Image Selection with automatic white-background processing
  const handleProductImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageProcessing(true);
    try {
      // Process photo to pure white studio background
      const whiteBgData = await processProductToWhiteBackground(file);
      setProdForm(prev => ({ ...prev, imageUrl: whiteBgData }));
    } catch (err) {
      console.warn('Image processing fallback:', err);
      setProdForm(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    } finally {
      setImageProcessing(false);
    }
  };

  // Submit Add Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.sellingPrice) {
      setFormError('सामानको नाम र बिक्री मूल्य अनिवार्य छ');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const payload = {
      name: prodForm.name.trim(),
      nameEn: prodForm.nameEn?.trim() || '',
      brand: prodForm.brand?.trim() || '',
      variant: prodForm.variant?.trim() || '',
      size: prodForm.size?.trim() || '',
      sellingPrice: parseFloat(prodForm.sellingPrice) || 0,
      costPrice: parseFloat(prodForm.costPrice) || 0,
      stockQty: parseFloat(prodForm.stockQty) || 0,
      unit: prodForm.unit,
      minStockAlert: parseFloat(prodForm.minStockAlert) || 5,
      category: prodForm.category,
      imageUrl: prodForm.imageUrl || ''
    };

    try {
      try {
        const data = await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (data && !data.success) throw new Error(data.error || 'सामान थप्न सकिएन');
      } catch (netErr) {
        // Fallback: save to local offline products
        const cached = getInitialProducts();
        const newP = {
          _id: 'prod_' + Date.now(),
          ...payload
        };
        cached.unshift(newP);
        setLocalStore('kk_cached_prods', cached);
      }

      onRefreshProducts();
      setModalType(null);
      setProdForm({
        name: '',
        nameEn: '',
        sellingPrice: '',
        costPrice: '',
        stockQty: '',
        unit: 'थान',
        minStockAlert: '5',
        category: 'किराना',
        imageUrl: ''
      });
    } catch (err) {
      setFormError(formatErrorMessage(err, lang));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Stock Adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    const qty = parseFloat(adjustForm.delta);
    if (!qty || qty <= 0) {
      setFormError('मान्य परिमाण लेख्नुहोस्');
      return;
    }

    const delta = adjustForm.type === 'add' ? qty : -qty;

    setIsSubmitting(true);
    setFormError('');

    try {
      try {
        const data = await apiFetch(`/api/products/${selectedProduct._id}/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delta,
            reason: adjustForm.reason
          })
        });
        if (data && !data.success) throw new Error(data.error || 'स्टक अपडेट हुन सकेन');
      } catch (netErr) {
        // Fallback: adjust local store
        const cached = getInitialProducts();
        const found = cached.find(p => p._id === selectedProduct._id);
        if (found) {
          found.stockQty = Math.max(0, (found.stockQty || 0) + delta);
          setLocalStore('kk_cached_prods', cached);
        }
      }

      onRefreshProducts();
      setModalType(null);
    } catch (err) {
      setFormError(formatErrorMessage(err, lang));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">

      {/* 1. Header Card with Add Action & History Button */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#023c2e]" />
            <span>{t('stockTitle')}</span>
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {products.length} {t('totalRegisteredItems')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFormError(''); setModalType('add_product'); }}
            className="min-h-[52px] px-5 rounded-2xl bg-[#023c2e] hover:bg-[#034b39] text-white font-black text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 text-[#f5d77f]" />
            <span>{t('addProduct')}</span>
          </button>

          <button
            onClick={handleOpenHistory}
            className="min-h-[52px] px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center gap-1.5 border border-slate-300"
            title="View Stock Movement Audit History"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{t('stockHistoryBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('searchStock')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[56px] pl-12 pr-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 text-lg font-bold shadow-xs focus:border-[#023c2e]"
        />
      </div>

      {/* 3. Products List */}
      
      {/* Mobile Compact Table (block sm:hidden) */}
      <div className="block sm:hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs divide-y divide-slate-100">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-2.5">{lang === 'en' ? 'Item & Photo' : 'तस्बिर / सामान'}</th>
              <th className="py-2.5 px-2 text-right">{lang === 'en' ? 'Price' : 'बिक्री मूल्य'}</th>
              <th className="py-2.5 px-2 text-center">{lang === 'en' ? 'Stock' : 'स्टक'}</th>
              <th className="py-2.5 px-2 text-center">{lang === 'en' ? 'Adjust' : 'फेरबदल'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((p) => {
              const displayName = lang === 'en' && p.nameEn ? p.nameEn : p.name;
              const isLow = p.stockQty <= (p.minStockAlert || 5);

              return (
                <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Photo & Name */}
                  <td className="py-2 px-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(p.imageUrl)}
                          className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xs active:scale-95 hover:border-emerald-500"
                          title={lang === 'en' ? 'Click to enlarge photo' : 'तस्बिर ठूलो बनाएर हेर्नुहोस्'}
                        >
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5 text-emerald-800/40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate leading-tight">{displayName}</p>
                        <span className="text-[10px] text-slate-500 block">/{p.unit}</span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    <span className="font-black text-[#023c2e] text-xs">रु. {p.sellingPrice}</span>
                    {p.costPrice > 0 && (
                      <span className="block text-[10px] text-slate-400 font-bold">खरिद {p.costPrice}</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="py-2 px-2 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black inline-block ${
                      isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {p.stockQty}
                    </span>
                  </td>

                  {/* Quick Adjust Buttons */}
                  <td className="py-2 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setAdjustForm({ delta: '1', type: 'reduce', reason: lang === 'en' ? 'Sale or Damage' : 'बिक्री वा क्षति' });
                          setModalType('adjust_stock');
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 active:scale-90 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 flex items-center justify-center font-black"
                        title={t('reduceStock')}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setAdjustForm({ delta: '10', type: 'add', reason: lang === 'en' ? 'New Purchase Stock' : 'नयाँ खरिद स्टक थप' });
                          setModalType('adjust_stock');
                        }}
                        className="w-7 h-7 rounded-lg bg-emerald-100 active:scale-90 hover:bg-emerald-200 text-emerald-900 border border-emerald-400 flex items-center justify-center font-black"
                        title={t('addStock')}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Desktop / Tablet Cards (hidden sm:grid) with ENLARGED, Clear Images */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-3.5">
        {filtered.map((p) => {
          const isLow = p.stockQty <= (p.minStockAlert || 5);
          return (
            <div
              key={p._id}
              className={`p-4 rounded-2xl border bg-white transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-sm ${
                isLow ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Large, Clear Product Image Thumbnail */}
                <div 
                  onClick={() => p.imageUrl && setPreviewImageUrl(p.imageUrl)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-slate-200 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xs cursor-pointer group hover:border-emerald-600 transition-colors"
                  title={lang === 'en' ? 'Click to view full photo' : 'तस्बिर ठूलो बनाएर हेर्नुहोस्'}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  ) : (
                    <Package className="w-10 h-10 text-emerald-800/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {lang === 'en' && p.nameEn ? p.nameEn : p.name}
                    </h3>
                    {isLow && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 whitespace-nowrap">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('lowStockNotice')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block">{t('sellingPrice')}:</span>
                      <span className="text-lg font-black text-[#023c2e]">रु. {p.sellingPrice}</span>
                      <span className="text-xs text-slate-500 font-semibold"> / {p.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">{t('availableStock')}:</span>
                      <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                        {p.stockQty} {p.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stock Modify Buttons */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold">
                  {p.costPrice ? `${t('costLabel')} रु. ${p.costPrice}` : ''}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setAdjustForm({ delta: '1', type: 'reduce', reason: lang === 'en' ? 'Sale or Damage' : 'बिक्री वा क्षति' });
                      setModalType('adjust_stock');
                    }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1.5 border border-slate-300"
                  >
                    <ArrowDownCircle className="w-4 h-4 text-red-600" />
                    <span>{t('reduceStock')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setAdjustForm({ delta: '10', type: 'add', reason: lang === 'en' ? 'New Purchase Stock' : 'नयाँ खरिद स्टक थप' });
                      setModalType('adjust_stock');
                    }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs flex items-center gap-1.5 border border-emerald-400"
                  >
                    <ArrowUpCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t('addStock')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Modal for Enlarged Product Image Preview */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-3xl p-4 max-w-sm w-full shadow-2xl space-y-3 border border-slate-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-700" />
                {lang === 'en' ? 'Product Image Preview' : 'सामानको ठूलो तस्बिर'}
              </span>
              <button 
                type="button" 
                onClick={() => setPreviewImageUrl(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full h-64 rounded-2xl bg-white border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
              <img src={previewImageUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="w-full py-2.5 rounded-xl bg-[#023c2e] text-white text-xs font-bold"
            >
              {lang === 'en' ? 'Close' : 'बन्द गर्नुहोस्'}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PRODUCT ================= */}
      {modalType === 'add_product' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-xl font-black text-slate-900">{t('addProduct')}</h3>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('productNameNp')}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Sugar 1kg' : 'जस्तै: चिनी (१ के.जी.)'}
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('productNameEn')}</label>
                <input
                  type="text"
                  placeholder="e.g. Sugar 1kg"
                  value={prodForm.nameEn}
                  onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-semibold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-black mb-1">{t('sellingPrice')} (रु.) *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="105"
                    value={prodForm.sellingPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellingPrice: e.target.value })}
                    className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-black text-xl text-[#023c2e]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t('costPrice')} (रु.)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="94"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: e.target.value })}
                    className="w-full min-h-[56px] px-4 rounded-xl border border-slate-300 font-bold text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t('availableStock')}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="50"
                    value={prodForm.stockQty}
                    onChange={(e) => setProdForm({ ...prodForm, stockQty: e.target.value })}
                    className="w-full min-h-[56px] px-4 rounded-xl border border-slate-300 font-black text-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{t('unitLabel')}</label>
                  <select
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full min-h-[56px] px-3 rounded-xl border-2 border-slate-300 font-black text-lg bg-white"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Photo Upload with White Background */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs sm:text-sm">
                  {t('productImageLabel')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleProductImageSelect}
                  className="hidden"
                />

                {prodForm.imageUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-14 h-14 rounded-lg bg-white border border-slate-300 p-1 flex-shrink-0 flex items-center justify-center">
                      <img src={prodForm.imageUrl} alt="Uploaded preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {t('whiteBgReady')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, imageUrl: '' })}
                        className="text-red-500 hover:text-red-700 font-bold block mt-1"
                      >
                        {t('removePhoto')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageProcessing}
                    className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-slate-700 transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-800" />
                    <span>{imageProcessing ? t('processingBg') : t('takeOrChoosePhoto')}</span>
                  </button>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 font-bold text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[56px] rounded-2xl bg-[#023c2e] hover:bg-[#034b39] text-white text-xl font-black shadow-md flex items-center justify-center gap-2"
              >
                <span>{t('saveProductBtn')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST STOCK ================= */}
      {modalType === 'adjust_stock' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {adjustForm.type === 'add' ? `${t('addStock')} (+)` : `${t('reduceStock')} (-)`}
                </h3>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">{selectedProduct?.name}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-black text-lg mb-1">
                  {t('adjustQty')} ({selectedProduct?.unit})
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  autoFocus
                  placeholder="परिमाण"
                  value={adjustForm.delta}
                  onChange={(e) => setAdjustForm({ ...adjustForm, delta: e.target.value })}
                  className="w-full min-h-[60px] px-4 rounded-xl border-2 border-slate-400 text-3xl font-black text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('adjustReason')}</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border border-slate-300 font-bold text-base"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 font-bold text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full min-h-[60px] rounded-2xl text-white text-xl font-black shadow-md flex items-center justify-center gap-2 ${
                  adjustForm.type === 'add' ? 'bg-[#023c2e] hover:bg-[#034b39]' : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                <span>{t('saveAdjustment')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STOCK HISTORY ================= */}
      {modalType === 'stock_history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">{t('historyTitle')}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  {lang === 'en' ? 'Recent sales and inventory adjustment logs' : 'हालसालै भएका बिक्री तथा थपघट रेकर्ड'}
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-500 font-bold">{t('loading')}</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t('noTransactions')}</div>
              ) : (
                movements.map((m) => (
                  <div key={m._id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-sm">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{m.productName}</h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        {m.reason} • {new Date(m.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ne-NP')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-lg font-black ${m.delta > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                      <p className="text-xs text-slate-500">
                        {m.beforeQty} &rarr; {m.afterQty}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 mt-2 text-right">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
