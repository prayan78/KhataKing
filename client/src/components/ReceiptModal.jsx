import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import KhataKingLogo from './KhataKingLogo';
import { CheckCircle2, Printer, Share2, X, ArrowRight } from 'lucide-react';

export default function ReceiptModal({ sale, shop, onClose, onNewSale }) {
  const { t, lang } = useLanguage();
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Success Banner */}
        <div className="bg-emerald-700 text-white p-5 text-center flex flex-col items-center justify-center relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-emerald-800 text-emerald-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-100" />
          </div>
          <h2 className="text-2xl font-black">{t('saleSuccess')}</h2>
          <p className="text-emerald-100 text-lg font-bold mt-0.5">
            कुल: रु. {sale.grandTotal.toLocaleString()}
          </p>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 bg-slate-50 text-slate-800 border-b border-dashed border-slate-300">
          
          {/* Shop Header with KhataKing Logo */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200">
            <KhataKingLogo size={52} showText={false} className="mb-2" />
            <h3 className="text-xl font-black text-emerald-950">{shop?.name || 'हाम्रो किराना पसल'}</h3>
            <p className="text-sm text-slate-600 font-medium">{shop?.address || 'काठमाडौँ, नेपाल'} | फोन: {shop?.phone || '9800000000'}</p>
            {shop?.panNumber && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">प्यान नं: {shop.panNumber}</p>
            )}
            <div className="mt-2 inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold">
              {lang === 'en' ? 'Receipt #' : 'रसिद नं.'} {sale.saleNumber}
            </div>
          </div>

          {/* Sale Metadata */}
          <div className="py-3 text-sm text-slate-600 border-b border-slate-200 flex justify-between">
            <div>
              <span className="font-semibold text-slate-700">{lang === 'en' ? 'Customer:' : 'ग्राहक:'}</span> {sale.customerName}
            </div>
            <div>
              <span className="font-semibold text-slate-700">{lang === 'en' ? 'Type:' : 'प्रकार:'}</span> {sale.paymentType === 'cash' ? (lang === 'en' ? 'Cash' : 'नगद') : (lang === 'en' ? 'Credit' : 'उधारो')}
            </div>
          </div>

          {/* Line Items */}
          <div className="py-3">
            <div className="flex justify-between font-bold text-sm text-slate-500 mb-2 border-b border-slate-200 pb-1">
              <span>{lang === 'en' ? 'Details' : 'विवरण'}</span>
              <span>{lang === 'en' ? 'Qty × Rate = Total' : 'परिमाण × दर = जम्मा'}</span>
            </div>
            <div className="space-y-2 text-base">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="pr-2">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} {item.unit || 'थान'} @ रु. {item.unitPrice}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 whitespace-nowrap">
                    रु. {item.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-3 border-t-2 border-slate-800 flex justify-between items-center text-xl font-black text-slate-900">
            <span>{t('grandTotal')}</span>
            <span className="text-emerald-800 font-black text-2xl">
              रु. {sale.grandTotal.toLocaleString()}
            </span>
          </div>

          {sale.paymentType === 'cash' && sale.receivedAmount > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-sm text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>{t('receivedAmount')}</span>
                <span>रु. {sale.receivedAmount}</span>
              </div>
              {sale.changeAmount > 0 && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>{t('changeToReturn')}</span>
                  <span>रु. {sale.changeAmount}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-slate-500 italic">
            धन्यवाद ! फेरि पाल्नुहोला ।
            <br />
            <span className="font-bold text-emerald-800">KhataKing</span> द्वारा सञ्चालित
          </div>
        </div>

        {/* Footer Action Buttons (Large min 56px touch target) */}
        <div className="p-4 bg-white flex flex-col gap-2.5">
          <button
            onClick={onNewSale}
            className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-[#023c2e] hover:bg-[#034b39] active:scale-98 text-white text-xl font-extrabold flex items-center justify-center gap-2 shadow-md transition-transform"
          >
            <span>{t('nextSale')}</span>
            <ArrowRight className="w-6 h-6 text-[#f5d77f]" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[50px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 border border-slate-300"
            >
              <Printer className="w-5 h-5 text-slate-600" />
              <span>{lang === 'en' ? 'Print' : 'प्रिन्ट'}</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `KhataKing ${lang === 'en' ? 'Receipt' : 'रसिद'} ${sale.saleNumber}`,
                    text: `${shop?.name || 'किराना'} ${lang === 'en' ? 'Receipt #' : 'रसिद नं'} ${sale.saleNumber} - ${lang === 'en' ? 'Total: Rs.' : 'जम्मा: रु.'} ${sale.grandTotal}`,
                  }).catch(() => {});
                } else {
                  alert(lang === 'en' ? 'Receipt link copied!' : 'रसिद लिंक कपी भयो!');
                }
              }}
              className="min-h-[50px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 border border-slate-300"
            >
              <Share2 className="w-5 h-5 text-slate-600" />
              <span>{lang === 'en' ? 'Share' : 'शेयर'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

