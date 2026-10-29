import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShoppingCart, 
  BookOpen, 
  BarChart3, 
  Package, 
  ScanLine, 
  MoreHorizontal 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'sales', label: t('navSales'), icon: ShoppingCart },
    { id: 'udharo', label: t('navCredit'), icon: BookOpen },
    { id: 'totals', label: t('navTotals'), icon: BarChart3 },
    { id: 'stock', label: t('navStock'), icon: Package },
    { id: 'scan', label: t('navScan'), icon: ScanLine },
    { id: 'more', label: t('navMore'), icon: MoreHorizontal },
  ];

  return (
    <>
      {/* Mobile Fixed Bottom Navigation (visible on screens < 768px) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom Navigation"
      >
        <div className="grid grid-cols-6 h-[66px] max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 transition-colors select-none ${
                  isActive 
                    ? 'text-[#023c2e] font-black' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-100/90 text-[#023c2e] scale-110 shadow-xs' : ''
                }`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={isActive ? 2.6 : 2} />
                </div>
                <span className={`text-[11px] sm:text-[12px] leading-tight mt-0.5 tracking-tight ${
                  isActive ? 'font-black text-[#023c2e]' : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top/Sidebar Navigation Tab Bar (visible on screens >= 768px) */}
      <div className="hidden md:block bg-emerald-950 text-emerald-100 border-b border-emerald-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-lg transition-all min-h-[50px] ${
                  isActive
                    ? 'bg-[#d4af37] text-emerald-950 shadow-md font-black'
                    : 'text-emerald-100 hover:bg-emerald-900/60'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

