import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ReceiptModal from './components/ReceiptModal';
import SalesView from './views/SalesView';
import UdharoView from './views/UdharoView';
import TotalsView from './views/TotalsView';
import StockView from './views/StockView';
import ScanView from './views/ScanView';
import MoreView from './views/MoreView';

function MainApp() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'udharo' | 'totals' | 'stock' | 'scan' | 'more'
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all initial data with localStorage fallback
  const loadData = async () => {
    try {
      const [shopRes, prodRes, custRes, suppRes] = await Promise.all([
        fetch('/api/shop').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/products').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/customers').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/suppliers').then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (shopRes.success) {
        setShop(shopRes.shop);
        localStorage.setItem('kk_cached_shop', JSON.stringify(shopRes.shop));
      } else {
        const cached = localStorage.getItem('kk_cached_shop');
        if (cached) setShop(JSON.parse(cached));
      }

      if (prodRes.success && prodRes.products?.length) {
        setProducts(prodRes.products);
        localStorage.setItem('kk_cached_prods', JSON.stringify(prodRes.products));
      } else {
        const cached = localStorage.getItem('kk_cached_prods');
        if (cached) setProducts(JSON.parse(cached));
      }

      if (custRes.success && custRes.customers?.length) {
        setCustomers(custRes.customers);
        localStorage.setItem('kk_cached_custs', JSON.stringify(custRes.customers));
      } else {
        const cached = localStorage.getItem('kk_cached_custs');
        if (cached) setCustomers(JSON.parse(cached));
      }

      if (suppRes.success && suppRes.suppliers?.length) {
        setSuppliers(suppRes.suppliers);
        localStorage.setItem('kk_cached_supps', JSON.stringify(suppRes.suppliers));
      } else {
        const cached = localStorage.getItem('kk_cached_supps');
        if (cached) setSuppliers(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to load store data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaleCompleted = (newSale) => {
    setCurrentReceipt(newSale);
    loadData(); // refresh stock and customer balances
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      
      {/* Top Header with KhataKing Icon and Brand */}
      <Navbar 
        shop={shop} 
        onOpenProfile={() => setActiveTab('more')} 
      />

      {/* Main View Area with generous padding */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-bold">
            <div className="w-12 h-12 border-4 border-[#023c2e] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xl">KhataKing लोड हुँदैछ...</p>
          </div>
        ) : (
          <>
            {activeTab === 'sales' && (
              <SalesView
                products={products}
                customers={customers}
                onSaleCompleted={handleSaleCompleted}
                onAddCustomer={() => setActiveTab('udharo')}
              />
            )}

            {activeTab === 'udharo' && (
              <UdharoView
                customers={customers}
                suppliers={suppliers}
                onRefreshData={loadData}
              />
            )}

            {activeTab === 'totals' && (
              <TotalsView
                onViewReceipt={(sale) => setCurrentReceipt(sale)}
              />
            )}

            {activeTab === 'stock' && (
              <StockView
                products={products}
                onRefreshProducts={loadData}
              />
            )}

            {activeTab === 'scan' && (
              <ScanView
                onImportSuccess={loadData}
              />
            )}

            {activeTab === 'more' && (
              <MoreView
                shop={shop}
                onUpdateShop={(s) => setShop(s)}
              />
            )}
          </>
        )}
      </main>

      {/* 6-Destination Bottom Nav for Mobile & Responsive Desktop Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Receipt Modal */}
      {currentReceipt && (
        <ReceiptModal
          sale={currentReceipt}
          shop={shop}
          onClose={() => setCurrentReceipt(null)}
          onNewSale={() => {
            setCurrentReceipt(null);
            setActiveTab('sales');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </SettingsProvider>
  );
}

