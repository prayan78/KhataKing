import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, getInitialCustomers, getInitialSuppliers, setLocalStore } from '../utils/api';
import { 
  Users, 
  Truck, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Phone, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function UdharoView({ customers, suppliers, onRefreshData }) {
  const { t, lang } = useLanguage();

  // Active Tab: 'receivable' (Customers owe us) vs 'payable' (We owe suppliers)
  const [activeTab, setActiveTab] = useState('receivable');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'add_person' | 'add_udharo' | 'add_payment' | 'view_history'
  const [selectedParty, setSelectedParty] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    amount: '',
    notes: '',
    partyId: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute totals
  const totalReceivable = customers.reduce((sum, c) => sum + (c.totalUdharo || 0), 0);
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.totalPayable || 0), 0);

  // Filter lists
  const currentList = activeTab === 'receivable' ? customers : suppliers;
  const filteredList = currentList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.phone && item.phone.includes(q))
    );
  });

  // Open ledger history for a party
  const handleOpenHistory = async (party) => {
    setSelectedParty(party);
    setModalType('view_history');
    setHistoryLoading(true);
    try {
      const type = activeTab === 'receivable' ? 'Customer' : 'Supplier';
      const data = await apiFetch(`/api/udharo/ledger/${type}/${party._id}`);
      if (data && data.success) {
        setLedgerHistory(data.history || []);
      }
    } catch (e) {
      console.warn('Could not load ledger history:', e);
      setLedgerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open transaction modal for a party
  const handleOpenTransaction = (type, party = null) => {
    setSelectedParty(party);
    setFormData({
      name: party ? party.name : '',
      phone: party ? (party.phone || '') : '',
      address: '',
      amount: '',
      notes: '',
      partyId: party ? party._id : ''
    });
    setFormError('');
    setModalType(type);
  };

  // Submit Add Person
  const handleSavePerson = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(t('errNameRequired'));
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    const personPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      totalUdharo: 0,
      totalPayable: 0
    };

    try {
      const endpoint = activeTab === 'receivable' ? '/api/customers' : '/api/suppliers';
      try {
        const data = await apiFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personPayload)
        });
        if (data && !data.success) throw new Error(data.error || (lang === 'en' ? 'Could not save' : 'सुरक्षित गर्न सकिएन'));
      } catch (netErr) {
        // Fallback: update offline cache
        if (activeTab === 'receivable') {
          const custs = getInitialCustomers();
          custs.unshift({ _id: 'cust_' + Date.now(), ...personPayload });
          setLocalStore('kk_cached_custs', custs);
        } else {
          const supps = getInitialSuppliers();
          supps.unshift({ _id: 'supp_' + Date.now(), ...personPayload });
          setLocalStore('kk_cached_supps', supps);
        }
      }

      onRefreshData();
      setModalType(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Udharo or Payment Entry
  const handleSaveLedgerEntry = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      setFormError(t('errValidAmount'));
      return;
    }
    if (!formData.partyId && !selectedParty) {
      setFormError(t('errSelectPerson'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const partyType = activeTab === 'receivable' ? 'Customer' : 'Supplier';
      const pId = selectedParty ? selectedParty._id : formData.partyId;

      let entryType = '';
      if (partyType === 'Customer') {
        entryType = modalType === 'add_udharo' ? 'SALE_CREDIT' : 'PAYMENT_RECEIVED';
      } else {
        entryType = modalType === 'add_udharo' ? 'PURCHASE_CREDIT' : 'PAYMENT_MADE';
      }

      try {
        const data = await apiFetch('/api/udharo/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyType,
            partyId: pId,
            amount: amt,
            entryType,
            notes: formData.notes
          })
        });
        if (data && !data.success) throw new Error(data.error || (lang === 'en' ? 'Could not record' : 'रेकर्ड राख्न सकिएन'));
      } catch (netErr) {
        // Offline ledger balance adjustment
        if (partyType === 'Customer') {
          const custs = getInitialCustomers();
          const c = custs.find(item => item._id === pId);
          if (c) {
            c.totalUdharo = Math.max(0, (c.totalUdharo || 0) + (entryType === 'SALE_CREDIT' ? amt : -amt));
            setLocalStore('kk_cached_custs', custs);
          }
        } else {
          const supps = getInitialSuppliers();
          const s = supps.find(item => item._id === pId);
          if (s) {
            s.totalPayable = Math.max(0, (s.totalPayable || 0) + (entryType === 'PURCHASE_CREDIT' ? amt : -amt));
            setLocalStore('kk_cached_supps', supps);
          }
        }
      }

      onRefreshData();
      setModalType(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">

      {/* 1. Two Large Navigation Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setActiveTab('receivable'); setSearchQuery(''); }}
          className={`min-h-[64px] rounded-2xl flex flex-col items-center justify-center p-3 font-black text-lg transition-all shadow-md active:scale-98 ${
            activeTab === 'receivable'
              ? 'bg-[#023c2e] text-white ring-4 ring-emerald-500/30'
              : 'bg-white text-emerald-950 border-2 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#f5d77f]" />
            <span>{t('customersOweUs')}</span>
          </div>
          <span className="text-xs font-semibold opacity-90 mt-0.5">
            {t('customersOweSub')}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('payable'); setSearchQuery(''); }}
          className={`min-h-[64px] rounded-2xl flex flex-col items-center justify-center p-3 font-black text-lg transition-all shadow-md active:scale-98 ${
            activeTab === 'payable'
              ? 'bg-amber-700 text-white ring-4 ring-amber-400/30'
              : 'bg-white text-amber-950 border-2 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-200" />
            <span>{t('weOweOthers')}</span>
          </div>
          <span className="text-xs font-semibold opacity-90 mt-0.5">
            {t('weOweSub')}
          </span>
        </button>
      </div>

      {/* 2. Total Outstanding Card with Royal KhataKing Styling */}
      <div className={`p-5 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        activeTab === 'receivable' 
          ? 'bg-gradient-to-br from-[#034b39] to-[#02281e]' 
          : 'bg-gradient-to-br from-amber-700 to-amber-900'
      }`}>
        <div>
          <span className="text-sm sm:text-base font-bold text-amber-200 block uppercase tracking-wider">
            {activeTab === 'receivable' ? t('totalReceivable') : t('totalPayable')}
          </span>
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 block">
            रु. {(activeTab === 'receivable' ? totalReceivable : totalPayable).toLocaleString()}
          </span>
        </div>

        {/* Action button to add person */}
        <button
          onClick={() => handleOpenTransaction('add_person')}
          className="min-h-[52px] px-5 rounded-xl bg-white text-slate-900 font-extrabold text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5 text-emerald-800" />
          <span>{activeTab === 'receivable' ? t('addCustomerBtn') : t('addSupplierBtn')}</span>
        </button>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('searchPerson')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[56px] pl-12 pr-4 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 text-lg font-bold shadow-xs focus:border-emerald-800"
        />
      </div>

      {/* 4. Person Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl text-center text-slate-500 border border-slate-200">
            <p className="text-xl font-bold">{t('noAccountFound')}</p>
            <p className="text-sm mt-1">{t('noAccountSub')}</p>
          </div>
        ) : (
          filteredList.map((person) => {
            const balance = activeTab === 'receivable' ? person.totalUdharo : person.totalPayable;
            const hasDue = balance > 0;

            return (
              <div
                key={person._id}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Person details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{person.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      hasDue 
                        ? (activeTab === 'receivable' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hasDue ? t('statusDue') : t('statusClear')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-semibold mt-1">
                    {person.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a href={`tel:${person.phone}`} className="text-blue-600 hover:underline">{person.phone}</a>
                      </span>
                    )}
                    {person.address && (
                      <span>{t('locationLabel')}: {person.address}</span>
                    )}
                    {person.notes && (
                      <span className="text-slate-500 italic">"{person.notes}"</span>
                    )}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-slate-500 font-bold">{t('balance')}:</span>
                    <span className={`text-2xl font-black ${
                      hasDue ? (activeTab === 'receivable' ? 'text-amber-700' : 'text-red-600') : 'text-emerald-700'
                    }`}>
                      रु. {(balance || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Action buttons with large touch areas */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenTransaction('add_udharo', person)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-sm flex items-center gap-1.5 border border-amber-300"
                    >
                      <Plus className="w-4 h-4 text-amber-700" />
                      <span>{activeTab === 'receivable' ? t('addCreditBtn') : t('addPurchaseBtn')}</span>
                    </button>

                    <button
                      onClick={() => handleOpenTransaction('add_payment', person)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-sm flex items-center gap-1.5 border border-emerald-300"
                    >
                      {activeTab === 'receivable' ? (
                        <>
                          <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                          <span>{t('receivePaymentBtn')}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                          <span>{t('makePaymentBtn')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenHistory(person)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1 border border-slate-200"
                    >
                      <History className="w-4 h-4 text-slate-500" />
                      <span>{t('ledgerBtn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: ADD PERSON ================= */}
      {modalType === 'add_person' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-xl font-black text-slate-900">
                {activeTab === 'receivable' ? t('addCustomerBtn') : t('addSupplierBtn')}
              </h3>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('fullNameRequired')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('phoneLabel')}</label>
                <input
                  type="tel"
                  placeholder={t('phonePlaceholder')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('addressLabel')}</label>
                <input
                  type="text"
                  placeholder={t('addressPlaceholder')}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-lg"
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
                className="w-full min-h-[56px] rounded-2xl bg-[#023c2e] hover:bg-[#034b39] text-white text-xl font-black shadow-md flex items-center justify-center gap-2"
              >
                <span>{t('saveBtn')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD UDHARO OR PAYMENT ================= */}
      {(modalType === 'add_udharo' || modalType === 'add_payment') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {modalType === 'add_udharo' 
                    ? (activeTab === 'receivable' ? t('addCreditModalTitle') : t('addPurchaseModalTitle'))
                    : (activeTab === 'receivable' ? t('receivePaymentModalTitle') : t('makePaymentModalTitle'))
                  }
                </h3>
                <p className="text-sm font-bold text-emerald-800 mt-0.5">
                  {t('accountHolder')}: {selectedParty?.name}
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveLedgerEntry} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-black text-lg mb-1">
                  {t('amountLabel')} (रु.) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                    रु.
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    autoFocus
                    placeholder={t('amountPlaceholder')}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full min-h-[60px] pl-14 pr-4 rounded-xl border-2 border-slate-400 text-3xl font-black text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{t('notesLabel')}</label>
                <input
                  type="text"
                  placeholder={t('notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[56px] px-4 rounded-xl border-2 border-slate-300 font-bold text-base"
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
                  modalType === 'add_udharo' 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-[#023c2e] hover:bg-[#034b39]'
                }`}
              >
                <span>{t('saveToLedgerBtn')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW HISTORY ================= */}
      {modalType === 'view_history' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedParty?.name}</h3>
                <p className="text-sm font-bold text-slate-500">{t('ledgerHistorySubtitle')}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-500 font-bold">{t('loading')}</div>
              ) : ledgerHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t('noTransactions')}</div>
              ) : (
                ledgerHistory.map((item) => {
                  const isPositiveDebt = item.entryType === 'SALE_CREDIT' || item.entryType === 'PURCHASE_CREDIT';
                  return (
                    <div key={item._id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
                            isPositiveDebt ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {item.entryType === 'SALE_CREDIT' ? t('creditTaken') :
                             item.entryType === 'PAYMENT_RECEIVED' ? t('paymentReceived') :
                             item.entryType === 'PURCHASE_CREDIT' ? t('purchaseCredit') : t('supplierPaid')}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            {new Date(item.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ne-NP')}
                          </span>
                        </div>
                        {item.notes && <p className="text-sm font-semibold text-slate-700 mt-1">{item.notes}</p>}
                      </div>

                      <div className="text-right">
                        <span className={`text-lg font-black ${isPositiveDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {isPositiveDebt ? '+' : '-'} रु. {item.amount.toLocaleString()}
                        </span>
                        <p className="text-xs text-slate-500 font-semibold">
                          {t('dueLabel')}: रु. {item.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-3 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-500 block font-bold">{t('currentDueLabel')}:</span>
                <span className="text-2xl font-black text-[#023c2e]">
                  रु. {((activeTab === 'receivable' ? selectedParty?.totalUdharo : selectedParty?.totalPayable) || 0).toLocaleString()}
                </span>
              </div>
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

