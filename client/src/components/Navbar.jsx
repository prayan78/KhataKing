import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import KhataKingLogo from './KhataKingLogo';
import { Globe, Store, ShieldCheck } from 'lucide-react';

export default function Navbar({ shop, onOpenProfile }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#023c2e] text-white shadow-md border-b border-[#055340]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Brand & Logo with user's uploaded icon */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onOpenProfile}>
          <KhataKingLogo size={46} showText={false} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1">
                Khata<span className="text-[#f5d77f]">King</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-600/50">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {t('nepalKirana')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 font-medium truncate max-w-[200px] sm:max-w-xs">
              {shop?.name || t('defaultShopName')}
            </p>
          </div>
        </div>

        {/* Action Controls: Language Toggle & Time */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex flex-col text-right pr-2">
            <span className="text-xs text-emerald-300">{t('kathmanduTime')}</span>
            <span className="text-sm font-bold text-white tracking-wider">{timeStr}</span>
          </div>

          {/* Bilingual Switcher: Crystal clear visual state */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 p-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-white border border-[#d4af37]/70 shadow-sm active:scale-95 transition-all min-h-[46px]"
            title="Switch Language / भाषा फेर्नुहोस्"
            aria-label="Toggle Nepali or English language"
          >
            <Globe className="w-5 h-5 text-[#f5d77f] ml-1.5" />
            <div className="flex items-center text-xs font-black rounded-lg bg-emerald-900/90 p-0.5 border border-emerald-700">
              <span className={`px-2.5 py-1 rounded-md transition-all ${lang === 'ne' ? 'bg-[#d4af37] text-emerald-950 font-black shadow-xs' : 'text-emerald-200'}`}>
                नेपाली
              </span>
              <span className={`px-2.5 py-1 rounded-md transition-all ${lang === 'en' ? 'bg-[#d4af37] text-emerald-950 font-black shadow-xs' : 'text-emerald-200'}`}>
                English
              </span>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
}

