import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import KhataKingLogo from '../components/KhataKingLogo';
import { apiFetch, getApiBaseUrl, setApiBaseUrl, testServerConnection, setLocalStore } from '../utils/api';
import { 
  Store, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Users, 
  Globe, 
  HelpCircle, 
  ShieldCheck, 
  Smartphone, 
  PhoneCall, 
  CheckCircle,
  Type,
  Maximize2,
  X,
  Server,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

export default function MoreView({ shop, onUpdateShop }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { textScale, setTextScale, density, setDensity } = useSettings();
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: shop?.name || '',
    ownerName: shop?.ownerName || '',
    phone: shop?.phone || '',
    address: shop?.address || '',
    panNumber: shop?.panNumber || ''
  });

  // Server URL & Connection diagnostics for Android / LAN
  const [serverUrl, setServerUrlState] = useState(getApiBaseUrl() || 'http://10.0.2.2:5000');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  const checkConnection = async (targetUrl = serverUrl) => {
    setCheckingConnection(true);
    const res = await testServerConnection(targetUrl);
    setConnectionStatus(res);
    setCheckingConnection(false);
  };

  useEffect(() => {
    checkConnection(getApiBaseUrl());
  }, []);

  const handleApplyServerUrl = (urlToSet) => {
    setServerUrlState(urlToSet);
    setApiBaseUrl(urlToSet);
    checkConnection(urlToSet);
  };

  // Voice narration helper in Nepali for elderly kirana shopkeepers
  const speakNepaliTutorial = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('तपाईंको ब्राउजरमा आवाज सुविधा उपलब्ध छैन');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ne-NP';
    utterance.rate = 0.9; // Slightly slower, clear tone for older listeners

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    setIsPlayingVoice(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      try {
        const data = await apiFetch('/api/shop', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shopForm)
        });
        if (data && data.success && data.shop) {
          if (onUpdateShop) onUpdateShop(data.shop);
        }
      } catch (netErr) {
        setLocalStore('kk_cached_shop', shopForm);
        if (onUpdateShop) onUpdateShop(shopForm);
      }
      setShowShopModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const tutorials = [
    {
      title: '१. नगद वा छिटो बिक्री कसरी गर्ने?',
      audio: 'बिक्री गर्नका लागि बिक्री स्क्रिनमा जानुहोस्। सामानमा थिच्नुहोस् वा छिटो बिक्रीमा रकम लेखेर हरियो बटन थिच्नुहोस्। यसले तुरुन्तै रसिद बनाउँछ।',
      desc: 'तलको बिक्री स्क्रिनमा जानुहोस्, सामान छान्नुहोस् वा सिधै रकम लेख्नुहोस् र हरियो "नगद बिक्री पूरा गर्नुहोस्" मा थिच्नुहोस्।'
    },
    {
      title: '२. उधारो सामान कसरी चढाउने?',
      audio: 'उधारो बिक्री गर्नका लागि उधारो बिक्री बटन छान्नुहोस्। ग्राहकको नाम छान्नुहोस् र उधारोमा राख्नुहोस् थिच्नुहोस्।',
      desc: 'बिक्रीमा "उधारो बिक्री" थिच्नुहोस्, ग्राहक छान्नुहोस् वा नाम लेख्नुहोस्, र "उधारोमा राख्नुहोस्" थिच्नुहोस्।'
    },
    {
      title: '३. ग्राहकले उधारो तिर्दा के गर्ने?',
      audio: 'उधारो स्क्रिनमा गएर ग्राहकको नाम छेउको रकम बुझिलिने बटन थिच्नुहोस् र रकम लेख्नुहोस्।',
      desc: 'उधारो स्क्रिनमा जानुहोस्, ग्राहकको नाम छेउको "रकम बुझिलिने" मा थिच्नुहोस् र लिएको रकम लेख्नुहोस्।'
    },
    {
      title: '४. पुरानो कागजको खाता कसरी स्क्यान गर्ने?',
      audio: 'कागज स्क्यानमा गएर आफ्नो रजिस्टरको फोटो खिच्नुहोस्। कम्प्युटरले अक्षर पढेपछि हेरेर स्वीकृत गर्नुहोस्।',
      desc: 'कागज स्क्यानमा जानुहोस्, क्यामेराबाट फोटो खिच्नुहोस्, नाम र रकम जाँचेर "स्वीकृत रेकर्ड खातामा चढाउनुहोस्" थिच्नुहोस्।'
    }
  ];

  return (
    <div className="space-y-4 pb-20">

      {/* 1. Shop Profile Card with KhataKing Badge */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <KhataKingLogo size={56} showText={false} />
          <div>
            <h2 className="text-xl font-black text-slate-900">{shop?.name || 'हाम्रो किराना पसल'}</h2>
            <p className="text-sm font-semibold text-slate-500">
              साहूजी: {shop?.ownerName || 'साहूजी'} • फोन: {shop?.phone || '९८...'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{shop?.address || 'काठमाडौँ'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowShopModal(true)}
          className="min-h-[46px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300"
        >
          सच्याउने
        </button>
      </div>

      {/* 2. Special Audio & Visual Help for 60-70 yr Old Shopkeepers */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#f5d77f] flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-[#f5d77f]" />
              <span>{t('voiceTutorial')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
              {t('audioHelpDesc')}
            </p>
          </div>

          <button
            onClick={() => speakNepaliTutorial('नमस्कार ! खाताकिङ्ग नेपालको सजिलो किराना पसल व्यवस्थापन एपमा स्वागत छ। यो एप ६० देखि ७० वर्षका अग्रज साहूजीहरूले पनि सजिलै चलाउन सक्ने गरी बनाइएको छ।')}
            className={`min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              isPlayingVoice 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-[#d4af37] text-emerald-950 hover:bg-[#e5c158]'
            }`}
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-5 h-5" />
                <span>आवाज रोक्नुहोस्</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>परिचय सुन्नुहोस् (Play Audio)</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-step guides with instant audio reader */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {tutorials.map((tut, i) => (
            <div key={i} className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-base text-white">{tut.title}</h4>
                <button
                  onClick={() => speakNepaliTutorial(tut.audio)}
                  className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-[#f5d77f]"
                  title="Listen to this instruction"
                  aria-label="Listen"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium leading-relaxed">
                {tut.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Settings List */}
      <div className="bg-white rounded-3xl divide-y divide-slate-100 border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Text Size (अक्षरको आकार) */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">अक्षरको आकार (Text Size)</h4>
              <p className="text-xs text-slate-500 font-semibold">आफ्नो सुविधा अनुसार अक्षर ठूलो वा सानो बनाउनुहोस्</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'compact', label: 'सानो (Compact)' },
              { id: 'normal', label: 'मध्यम (Normal)' },
              { id: 'large', label: 'ठूलो (Large)' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTextScale(opt.id)}
                className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  textScale === opt.id
                    ? 'bg-[#023c2e] text-white border-[#023c2e] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Density & Padding (प्याडिङ तथा स्पेसिङ) */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">स्क्रिन प्याडिङ (Layout Padding)</h4>
              <p className="text-xs text-slate-500 font-semibold">स्क्रिनमा ठाउँ धेरै वा कम देखाउने</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'compact', label: 'कम्प्याक्ट (Compact)' },
              { id: 'normal', label: 'मध्यम (Comfortable)' },
              { id: 'spacious', label: 'फराकिलो (Spacious)' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDensity(opt.id)}
                className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  density === opt.id
                    ? 'bg-[#023c2e] text-white border-[#023c2e] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Server Connection (Android & Network Settings) */}
        <div className="p-4 space-y-3 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">सर्भर जडान (Server Connection)</h4>
                <p className="text-xs text-slate-500 font-semibold">
                  Android मोबाइल वा कम्प्युटर सर्भर ठेगाना
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {connectionStatus?.connected ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  <Wifi className="w-3.5 h-3.5" />
                  जडान भयो (Online)
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                  <WifiOff className="w-3.5 h-3.5" />
                  अफलाइन खाता (Offline)
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="http://10.0.2.2:5000"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#023c2e]"
              />
              <button
                type="button"
                onClick={() => handleApplyServerUrl(serverUrl)}
                disabled={checkingConnection}
                className="px-4 py-2 bg-[#023c2e] hover:bg-[#034b39] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${checkingConnection ? 'animate-spin' : ''}`} />
                <span>जाँच्नुहोस्</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
              <span className="text-slate-400 py-1">सजिलो छनोट:</span>
              <button
                type="button"
                onClick={() => handleApplyServerUrl('http://10.0.2.2:5000')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                Android Emulator (10.0.2.2:5000)
              </button>
              <button
                type="button"
                onClick={() => handleApplyServerUrl('http://localhost:5000')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                Localhost (PC: 5000)
              </button>
              <button
                type="button"
                onClick={() => handleApplyServerUrl('')}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                Auto (Default)
              </button>
            </div>

            {connectionStatus && (
              <p className={`text-xs font-medium pt-1 ${connectionStatus.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
                {connectionStatus.connected 
                  ? '✅ ब्याकएन्ड सर्भरसँग सफलतापूर्वक जडान भएको छ। (Connected)' 
                  : 'ℹ️ सर्भरसँग जडान छैन — एप स्वचालित रूपमा पूर्ण सुरक्षित अफलाइन मोडमा चल्नेछ। (Offline Storage Active)'}
              </p>
            )}
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer" onClick={toggleLanguage}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">{t('languageSetting')}</h4>
              <p className="text-xs text-slate-500 font-semibold">नेपाली / English स्विच गर्नुहोस्</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-[#023c2e] font-black text-sm">
            {lang === 'ne' ? 'नेपाली' : 'English'}
          </span>
        </div>

        {/* App Version & Android PWA details */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">KhataKing App Version</h4>
              <p className="text-xs text-slate-500 font-semibold">Web, Mobile & Android PWA Ready</p>
            </div>
          </div>
          <span className="text-sm font-bold text-slate-600">v1.0 Production</span>
        </div>

      </div>

      {/* ================= MODAL: EDIT SHOP PROFILE ================= */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-xl font-black text-slate-900">{t('shopProfile')}</h3>
              <button onClick={() => setShowShopModal(false)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">पसलको नाम</label>
                <input
                  type="text"
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">साहूजीको नाम</label>
                <input
                  type="text"
                  value={shopForm.ownerName}
                  onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">सम्पर्क फोन</label>
                <input
                  type="tel"
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ठेगाना</label>
                <input
                  type="text"
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">प्यान / भ्याट नं.</label>
                <input
                  type="text"
                  value={shopForm.panNumber}
                  onChange={(e) => setShopForm({ ...shopForm, panNumber: e.target.value })}
                  className="w-full min-h-[52px] px-4 rounded-xl border border-slate-300 font-mono font-bold text-base"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[56px] rounded-2xl bg-[#023c2e] hover:bg-[#034b39] text-white text-xl font-black shadow-md mt-2"
              >
                {t('saveChanges')}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

