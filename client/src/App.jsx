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

import { 
  apiFetch, 
  getInitialShop, 
  getInitialProducts, 
  getInitialCustomers, 
  getInitialSuppliers,
  setLocalStore 
} from './utils/api';

function MainApp() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'udharo' | 'totals' | 'stock' | 'scan' | 'more'
  const [shop, setShop] = useState(getInitialShop);
  const [products, setProducts] = useState(getInitialProducts);
  const [customers, setCustomers] = useState(getInitialCustomers);
  const [suppliers, setSuppliers] = useState(getInitialSuppliers);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all initial data with robust fallback
  const loadData = async () => {
    try {
      const [shopRes, prodRes, custRes, suppRes] = await Promise.allSettled([
        apiFetch('/api/shop'),
        apiFetch('/api/products'),
        apiFetch('/api/customers'),
        apiFetch('/api/suppliers')
      ]);

      if (shopRes.status === 'fulfilled' && shopRes.value?.success && shopRes.value?.shop) {
        setShop(shopRes.value.shop);
        setLocalStore('kk_cached_shop', shopRes.value.shop);
      }

      if (prodRes.status === 'fulfilled' && prodRes.value?.success && prodRes.value?.products?.length) {
        setProducts(prodRes.value.products);
        setLocalStore('kk_cached_prods', prodRes.value.products);
      }

      if (custRes.status === 'fulfilled' && custRes.value?.success && custRes.value?.customers?.length) {
        setCustomers(custRes.value.customers);
        setLocalStore('kk_cached_custs', custRes.value.customers);
      }

      if (suppRes.status === 'fulfilled' && suppRes.value?.success && suppRes.value?.suppliers?.length) {
        setSuppliers(suppRes.value.suppliers);
        setLocalStore('kk_cached_supps', suppRes.value.suppliers);
      }
    } catch (e) {
      console.warn('API sync warning, using local cached data:', e);
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
                onViewReceipt={(sale) => setCurrentReceipt(sale)}
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

