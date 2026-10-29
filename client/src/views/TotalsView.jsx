import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, getOfflineTotals } from '../utils/api';
import { 
  BarChart3, 
  Calendar, 
  Banknote, 
  CreditCard, 
  Receipt, 
  ArrowDownLeft, 
  Wallet,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function TotalsView({ onViewReceipt }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month' | 'year'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTotals = async (selectedPeriod) => {
    setLoading(true);
    try {
      const result = await apiFetch(`/api/totals?period=${selectedPeriod}`);
      if (result && result.success && result.totals) {
        setData(result.totals);
      } else {
        setData(getOfflineTotals(selectedPeriod));
      }
    } catch (e) {
      console.warn('Backend fetch failed, using local offline totals:', e);
      setData(getOfflineTotals(selectedPeriod));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotals(period);
  }, [period]);

  const periods = [
    { id: 'today', label: t('periodToday') },
    { id: 'week', label: t('periodWeek') },
    { id: 'month', label: t('periodMonth') },
    { id: 'year', label: t('periodYear') },
  ];

  return (
    <div className="space-y-4 pb-20">

      {/* 1. Period Selector (Touch target 50px+) */}
      <div className="grid grid-cols-4 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`min-h-[50px] rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 ${
              period === p.id
                ? 'bg-[#023c2e] text-white shadow-md'
                : 'bg-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-slate-500 font-bold text-lg">
          {t('calculating')}
        </div>
      ) : (
        <>
          {/* 2. Top Large Sales Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#023c2e] via-[#034b39] to-[#01261d] text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm sm:text-base font-extrabold text-[#f5d77f] flex items-center gap-1.5 uppercase tracking-wide">
                <TrendingUp className="w-5 h-5 text-[#f5d77f]" />
                {t('totalSalesText')} ({periods.find(p => p.id === period)?.label})
              </span>
              <button 
                onClick={() => fetchTotals(period)}
                className="p-2 rounded-full hover:bg-white/10 text-emerald-200"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
              रु. {(data?.totalSales || 0).toLocaleString()}
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-sm sm:text-base font-semibold text-emerald-200">
              <span>{t('totalTransactions')}:</span>
              <span className="font-extrabold text-white text-base sm:text-lg">
                {data?.transactionCount || 0} {t('timesCount')}
              </span>
            </div>
          </div>

          {/* 3. Revenue Breakdown: Cash Sales vs Credit Sales */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 mb-1">
                <Banknote className="w-5 h-5" />
                <span className="font-extrabold text-sm sm:text-base">{t('cashSalesText')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                रु. {(data?.cashSales || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">{t('cashSalesSub')}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-amber-100 shadow-xs">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <CreditCard className="w-5 h-5" />
                <span className="font-extrabold text-sm sm:text-base">{t('creditSalesText')}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                रु. {(data?.creditSales || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">{t('creditSalesSub')}</p>
            </div>
          </div>

          {/* 4. Cash Drawer Reconciliation (CRITICAL: Old credit collection separated from revenue!) */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-800" />
              <span>{t('cashFlowTitle')}</span>
            </h3>

            <div className="divide-y divide-slate-100 text-base font-semibold">
              <div className="py-2.5 flex justify-between text-slate-700">
                <span>{t('cashFlow1')}</span>
                <span className="font-black text-slate-900">+ रु. {(data?.cashSales || 0).toLocaleString()}</span>
              </div>

              <div className="py-2.5 flex justify-between text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  {t('cashFlow2')}
                </span>
                <span className="font-black">+ रु. {(data?.oldCreditCollections || 0).toLocaleString()}</span>
              </div>

              {data?.paymentsMadeToSuppliers > 0 && (
                <div className="py-2.5 flex justify-between text-red-700">
                  <span>{t('cashFlow3')}</span>
                  <span className="font-black">- रु. {(data?.paymentsMadeToSuppliers || 0).toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 flex justify-between items-center text-xl font-black text-slate-900">
                <span>{t('cashInDrawer')}:</span>
                <span className="text-2xl text-[#023c2e]">
                  रु. {(data?.totalCashInDrawer || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              {t('cashFlowNote')}
            </p>
          </div>

          {/* 5. Transactions History in this period */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-600" />
              <span>{t('periodReceiptsTitle')} ({data?.transactions?.length || 0})</span>
            </h3>

            {data?.transactions?.length === 0 ? (
              <p className="text-slate-500 text-center py-4">{t('noSalesInPeriod')}</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {data?.transactions?.map((sale) => (
                  <div
                    key={sale._id}
                    onClick={() => onViewReceipt && onViewReceipt(sale)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl px-2 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{sale.saleNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          sale.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sale.paymentType === 'cash' ? (sale.paymentType === 'cash' && t('newSale').includes('Cash') ? 'Cash' : 'नगद') : (t('creditSale').includes('Credit') ? 'Credit' : 'उधारो')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {sale.customerName} • {new Date(sale.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">
                        रु. {sale.grandTotal.toLocaleString()}
                      </span>
                      <span className="block text-xs text-emerald-700 font-bold">{t('viewReceiptArrow')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
