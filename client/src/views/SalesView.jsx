import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, recordOfflineSale, getLocalStore, formatErrorMessage } from '../utils/api';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  UserCheck, 
  Zap, 
  CheckCircle, 
  ShoppingBag,
  CreditCard,
  Banknote,
  AlertCircle,
  Receipt,
  ArrowRight,
  Package
} from 'lucide-react';

export default function SalesView({ products, customers, onSaleCompleted, onViewReceipt, onAddCustomer }) {
  const { t, lang } = useLanguage();

  // Mode: 'cash' or 'credit'
  const [saleType, setSaleType] = useState('cash'); // 'cash' | 'credit'
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickItemName, setQuickItemName] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentSales, setRecentSales] = useState(() => getLocalStore('kk_offline_sales', []));

  // Fetch recent sales so shopkeeper always sees their persisted sales even after reload
  const fetchRecentSales = async () => {
    try {
      const data = await apiFetch('/api/sales');
      if (data && data.success && data.sales) {
        setRecentSales(data.sales);
      }
    } catch (e) {
      // Fallback to offline stored sales
      const local = getLocalStore('kk_offline_sales', []);
      setRecentSales(local);
    }
  };

  useEffect(() => {
    fetchRecentSales();
  }, []);

  // Cart calculation
  const grandTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  // Add inventory product to cart
  const handleAddToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: lang === 'en' && product.nameEn ? product.nameEn : product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          unit: product.unit || 'थान',
          lineTotal: product.sellingPrice
        }
      ];
    });
  };

  // Modify quantity
  const handleUpdateQty = (idx, delta) => {
    setCart((prev) => {
      const next = [...prev];
      const target = next[idx];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      target.quantity = newQty;
      target.lineTotal = newQty * target.unitPrice;
      return next;
    });
  };

  // Remove item
  const handleRemoveItem = (idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add quick sale custom item
  const handleAddQuickSale = (e) => {
    e?.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!amt || amt <= 0) {
      setErrorMessage('कृपया मान्य रकम लेख्नुहोस् (Enter valid amount)');
      return;
    }
    const name = quickItemName.trim() || `किराना सामान (रु. ${amt})`;
    setCart((prev) => [
      ...prev,
      {
        productId: null,
        name,
        unitPrice: amt,
        quantity: 1,
        unit: 'थान',
        lineTotal: amt
      }
    ]);
    setQuickAmount('');
    setQuickItemName('');
    setErrorMessage('');
  };

  // Submit sale with duplicate prevention
  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      setErrorMessage(t('emptyCartNotice'));
      return;
    }

    if (saleType === 'credit' && !selectedCustomerId && !newCustomerName.trim()) {
      setErrorMessage('उधारो बिक्रीको लागि कृपया ग्राहक छान्नुहोस् वा नाम लेख्नुहोस्');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const idempotencyKey = `sale_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      let custName = lang === 'en' ? 'Cash Customer' : 'नगद ग्राहक (Cash Customer)';
      if (saleType === 'credit') {
        const found = customers.find(c => c._id === selectedCustomerId);
        custName = found ? found.name : newCustomerName.trim();
      }

      const salePayload = {
        idempotencyKey,
        items: cart,
        grandTotal,
        paymentType: saleType,
        customerId: selectedCustomerId || null,
        customerName: custName,
        receivedAmount: saleType === 'cash' ? (parseFloat(receivedAmount) || grandTotal) : 0,
        notes: saleType === 'credit' ? (lang === 'en' ? 'Shop credit sale' : 'पसलबाट उधारो सामान') : (lang === 'en' ? 'Cash sale' : 'नगद बिक्री')
      };

      let finalSale = null;

      try {
        const data = await apiFetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(salePayload)
        });
        if (data && data.success && data.sale) {
          finalSale = data.sale;
        }
      } catch (netErr) {
        console.warn('Network API unavailable, recording sale locally:', netErr.message);
      }

      // If backend is offline or on standalone Android, record offline locally
      if (!finalSale) {
        finalSale = recordOfflineSale(salePayload);
      }

      // Reset form and notify parent to display receipt modal
      setCart([]);
      setSelectedCustomerId('');
      setNewCustomerName('');
      setReceivedAmount('');
      fetchRecentSales();
      onSaleCompleted(finalSale);
    } catch (err) {
      setErrorMessage(formatErrorMessage(err, lang) || (lang === 'en' ? 'Failed to record sale' : 'बिक्री सुरक्षित गर्न सकिएन'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  return (
    <div className="space-y-3 pb-16">
      
      {/* 1. Primary Mode Actions: Cash vs Credit */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setSaleType('cash')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-black text-base sm:text-lg transition-all shadow-xs active:scale-98 ${
            saleType === 'cash'
              ? 'bg-[#023c2e] text-white ring-2 ring-emerald-500/50'
              : 'bg-white text-emerald-950 border border-emerald-800/30 hover:bg-emerald-50'
          }`}
        >
          <Banknote className="w-5 h-5 text-[#f5d77f]" />
          <span>{t('newSale')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSaleType('credit')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-black text-base sm:text-lg transition-all shadow-xs active:scale-98 ${
            saleType === 'credit'
              ? 'bg-amber-600 text-white ring-2 ring-amber-400/50'
              : 'bg-white text-amber-900 border border-amber-600/30 hover:bg-amber-50'
          }`}
        >
          <CreditCard className="w-5 h-5 text-amber-200" />
          <span>{t('creditSale')}</span>
        </button>
      </div>

      {/* Credit Mode: Customer Picker */}
      {saleType === 'credit' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-xs animate-in fade-in">
          <label className="block text-amber-950 font-bold text-sm mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-700" />
            <span>{t('selectCustomer')}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) setNewCustomerName('');
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-amber-400 bg-white text-slate-900 text-sm font-bold"
            >
              <option value="">{t('selectCustomerPlaceholder')}</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} — {t('dueLabel')} {t('rs')} {c.totalUdharo}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder={t('addNewCustomerPlaceholder')}
              value={newCustomerName}
              onChange={(e) => {
                setNewCustomerName(e.target.value);
                if (e.target.value) setSelectedCustomerId('');
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-amber-400 bg-white text-slate-900 text-sm font-bold"
            />
          </div>
        </div>
      )}

      {/* 2. Quick Numeric Amount Input */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1">
            <Zap className="w-4 h-4 text-[#d4af37]" />
            {t('quickSaleTitle')}
          </span>
          <span className="text-[11px] text-slate-400">{t('quickSaleHint')}</span>
        </div>

        <form onSubmit={handleAddQuickSale} className="flex flex-col sm:flex-row gap-1.5">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              {t('rs')}
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t('quickSalePlaceholder')}
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-slate-300 focus:border-[#023c2e] text-base font-extrabold text-slate-900 bg-slate-50"
            />
          </div>
          
          <input
            type="text"
            placeholder={t('quickSaleItemName')}
            value={quickItemName}
            onChange={(e) => setQuickItemName(e.target.value)}
            className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 focus:border-[#023c2e] text-sm font-semibold text-slate-800 bg-slate-50"
          />

          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#f5d77f]" />
            <span>{t('addBtn')}</span>
          </button>
        </form>
      </div>

      {/* 3. Current Sale Bill Summary */}
      <div className="bg-white rounded-2xl shadow-xs border border-emerald-900/15 overflow-hidden">
        <div className="bg-[#023c2e] text-white px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#f5d77f]" />
            <h2 className="text-sm sm:text-base font-black">{t('saleSummary')}</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-[11px] font-bold text-emerald-100">
            {cart.length} {t('itemsCount')}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <p className="text-sm font-semibold">{t('emptyCartNotice')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-slate-50 text-sm">
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-xs text-slate-500">
                    {t('rs')} {item.unitPrice} / {item.unit}
                  </p>
                </div>

                {/* Compact Plus/Minus Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, -1)}
                    className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-90 flex items-center justify-center text-slate-800 font-black"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-7 text-center font-black text-slate-900 text-sm">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-100 hover:bg-emerald-200 active:scale-90 flex items-center justify-center text-emerald-900 font-black"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line total */}
                <div className="text-right pl-2 min-w-[70px]">
                  <span className="font-black text-slate-900 text-sm sm:text-base">
                    {t('rs')} {item.lineTotal.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="block ml-auto text-[11px] text-red-500 hover:text-red-700 font-bold"
                  >
                    {t('removeItem')}
                  </button>
                </div>
              </div>
            ))}

            {/* Grand Total Bar */}
            <div className="p-3 bg-emerald-50/70 border-t border-emerald-900/15 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">{t('grandTotal')}</span>
                <span className="text-xl sm:text-2xl font-black text-[#023c2e]">
                  {t('rs')} {grandTotal.toLocaleString()}
                </span>
              </div>

              {saleType === 'cash' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 font-bold hidden sm:inline">{t('receivedAmount')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={t('receivedAmountPlaceholder')}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-28 min-h-[40px] px-2.5 rounded-lg border border-slate-300 font-bold text-sm bg-white"
                  />
                </div>
              )}
            </div>

            {/* Error banner if validation fails */}
            {errorMessage && (
              <div className="p-2.5 bg-red-100 text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="p-3 bg-white">
              <button
                type="button"
                onClick={handleSubmitSale}
                disabled={isSubmitting || cart.length === 0}
                className={`w-full min-h-[50px] rounded-xl text-base sm:text-lg font-black text-white flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all ${
                  saleType === 'credit'
                    ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300'
                    : 'bg-[#023c2e] hover:bg-[#034b39] disabled:bg-slate-300'
                }`}
              >
                {isSubmitting ? (
                  <span>{t('saving')}</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-[#f5d77f]" />
                    <span>
                      {saleType === 'credit' ? t('recordAsCredit') : t('completeCashSale')} ({t('rs')} {grandTotal.toLocaleString()})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Searchable Kirana Products Catalog */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold text-slate-900">{t('frequentItems')}</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchItems')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 text-base font-semibold"
            />
          </div>
        </div>

        {/* Mobile Compact Kirana Table (sm:hidden) */}
        <div className="block sm:hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-2.5">{lang === 'en' ? 'Item' : 'सामान'}</th>
                <th className="py-2 px-2 text-right">{lang === 'en' ? 'Price' : 'मूल्य'}</th>
                <th className="py-2 px-2 text-center">{lang === 'en' ? 'Stock' : 'स्टक'}</th>
                <th className="py-2 px-2 text-center w-12">{lang === 'en' ? 'Add' : 'थप्ने'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.map((p) => {
                const displayName = lang === 'en' && p.nameEn ? p.nameEn : p.name;
                const inCart = cart.find(item => item.productId === p._id);
                const isLow = p.stockQty !== undefined && p.stockQty <= (p.minStockAlert || 5);

                return (
                  <tr
                    key={p._id}
                    onClick={() => handleAddToCart(p)}
                    className={`active:bg-emerald-100/70 transition-colors cursor-pointer select-none ${
                      inCart ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Item Photo + Name */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.imageUrl ? (
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight">{displayName}</p>
                          <span className="text-[10px] text-slate-500">/{p.unit || 'थान'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      <span className="font-black text-[#023c2e] text-xs">रु. {p.sellingPrice}</span>
                    </td>

                    {/* Stock */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      {p.stockQty !== undefined ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.stockQty}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Add (+) Button */}
                    <td className="py-1.5 px-2 text-center" onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}>
                      <button
                        type="button"
                        className="w-7 h-7 mx-auto rounded-lg bg-emerald-800 active:scale-90 hover:bg-emerald-900 text-white flex items-center justify-center font-black shadow-2xs"
                        aria-label="Add"
                      >
                        <Plus className="w-4 h-4 text-[#f5d77f]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop / Tablet Grid (hidden sm:grid) */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const displayName = lang === 'en' && p.nameEn ? p.nameEn : p.name;
            const inCart = cart.find(item => item.productId === p._id);
            return (
              <div
                key={p._id}
                onClick={() => handleAddToCart(p)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-97 select-none ${
                  inCart 
                    ? 'bg-emerald-50/80 border-emerald-600 shadow-xs' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                {/* Product Image Thumbnail if present */}
                {p.imageUrl && (
                  <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900 truncate">{displayName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base sm:text-lg font-black text-[#023c2e]">
                      रु. {p.sellingPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      / {p.unit}
                    </span>
                    {p.stockQty !== undefined && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${
                        p.stockQty <= (p.minStockAlert || 5)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        स्टक: {p.stockQty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Plus Button */}
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0"
                  aria-label="Add to cart"
                >
                  <Plus className="w-5 h-5 text-[#f5d77f]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Completed Sales (Persisted & visible even on reload!) */}
      {recentSales.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#023c2e]" />
                <span>{t('todaySalesTitle')}</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold">{t('todaySalesSub')}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
              {recentSales.length} {t('itemsCount')}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {recentSales.map((sale) => (
              <div
                key={sale._id}
                onClick={() => onViewReceipt && onViewReceipt(sale)}
                className="py-2.5 px-2 rounded-xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{sale.saleNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      sale.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sale.paymentType === 'cash' ? (lang === 'en' ? 'Cash' : 'नगद') : (lang === 'en' ? 'Credit' : 'उधारो')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {sale.customerName} • {new Date(sale.date).toLocaleTimeString(lang === 'en' ? 'en-US' : 'ne-NP', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black text-[#023c2e]">
                    रु. {sale.grandTotal.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewReceipt) onViewReceipt(sale);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold hidden sm:inline-flex items-center gap-1"
                  >
                    <span>{t('viewReceiptBtn')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

