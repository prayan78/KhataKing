// Pre-bundled fallback seed for 100% offline & standalone mobile resilience
export const DEFAULT_SHOP = {
  _id: 'shop_kirana_001',
  name: 'शुभलाभ किराना स्टोर (Shubhalabh Kirana)',
  ownerName: 'राम प्रसाद श्रेष्ठ',
  phone: '9841234567',
  address: 'असन, काठमाडौँ',
  panNumber: '304918274',
  currency: 'NPR',
  language: 'ne'
};

export const DEFAULT_PRODUCTS = [
  {
    _id: 'prod_1',
    shopId: 'shop_kirana_001',
    name: 'सोना मन्सुली चामल (२५ के.जी.)',
    nameEn: 'Sona Mansuli Rice 25kg',
    sellingPrice: 1950,
    costPrice: 1750,
    stockQty: 32,
    unit: 'पोका',
    minStockAlert: 5,
    barcode: '8901230001',
    category: 'खाद्यान्न',
    isActive: true
  },
  {
    _id: 'prod_2',
    shopId: 'shop_kirana_001',
    name: 'धारा सनफ्लावर तेल (१ लिटर)',
    nameEn: 'Dhara Sunflower Oil 1L',
    sellingPrice: 240,
    costPrice: 215,
    stockQty: 48,
    unit: 'बोतल',
    minStockAlert: 10,
    barcode: '8901230002',
    category: 'तेल तथा घ्यू',
    isActive: true
  },
  {
    _id: 'prod_3',
    shopId: 'shop_kirana_001',
    name: 'चिनी (१ के.जी.)',
    nameEn: 'Sugar 1kg',
    sellingPrice: 105,
    costPrice: 94,
    stockQty: 83,
    unit: 'के.जी.',
    minStockAlert: 15,
    barcode: '8901230003',
    category: 'खाद्यान्न',
    isActive: true
  },
  {
    _id: 'prod_4',
    shopId: 'shop_kirana_001',
    name: 'मसुरो दाल (१ के.जी.)',
    nameEn: 'Masuro Daal 1kg',
    sellingPrice: 160,
    costPrice: 142,
    stockQty: 40,
    unit: 'के.जी.',
    minStockAlert: 10,
    barcode: '8901230004',
    category: 'दाल तथा गेडागुडी',
    isActive: true
  },
  {
    _id: 'prod_5',
    shopId: 'shop_kirana_001',
    name: 'वाइवाइ चाउचाउ (१ पोका)',
    nameEn: 'Wai Wai Noodles 1pkt',
    sellingPrice: 25,
    costPrice: 21,
    stockQty: 116,
    unit: 'पोका',
    minStockAlert: 24,
    barcode: '8901230005',
    category: 'खाजा तथा स्न्याक्स',
    isActive: true
  },
  {
    _id: 'prod_6',
    shopId: 'shop_kirana_001',
    name: 'डिडिसी गाईको दूध (आधा लिटर)',
    nameEn: 'DDC Cow Milk 500ml',
    sellingPrice: 50,
    costPrice: 44,
    stockQty: 18,
    unit: 'पोका',
    minStockAlert: 8,
    barcode: '8901230006',
    category: 'दुग्धजन्य',
    isActive: true
  },
  {
    _id: 'prod_7',
    shopId: 'shop_kirana_001',
    name: 'ताजा अण्डा (१ क्रेट - ३० वटा)',
    nameEn: 'Fresh Eggs 1 Crate (30 pcs)',
    sellingPrice: 440,
    costPrice: 400,
    stockQty: 14,
    unit: 'थान',
    minStockAlert: 4,
    barcode: '8901230007',
    category: 'खाद्य',
    isActive: true
  },
  {
    _id: 'prod_8',
    shopId: 'shop_kirana_001',
    name: 'आयोडिन नुन (१ के.जी.)',
    nameEn: 'Iodized Salt 1kg',
    sellingPrice: 26,
    costPrice: 22,
    stockQty: 60,
    unit: 'पोका',
    minStockAlert: 15,
    barcode: '8901230008',
    category: 'खाद्यान्न',
    isActive: true
  },
  {
    _id: 'prod_9',
    shopId: 'shop_kirana_001',
    name: 'टोकला चियापत्ती (५०० ग्राम)',
    nameEn: 'Tokla Tea 500g',
    sellingPrice: 290,
    costPrice: 260,
    stockQty: 22,
    unit: 'पोका',
    minStockAlert: 6,
    barcode: '8901230009',
    category: 'खाद्यान्न',
    isActive: true
  },
  {
    _id: 'prod_10',
    shopId: 'shop_kirana_001',
    name: 'लाइफब्वाय साबुन (१ थान)',
    nameEn: 'Lifebuoy Soap 1pc',
    sellingPrice: 45,
    costPrice: 38,
    stockQty: 35,
    unit: 'थान',
    minStockAlert: 10,
    barcode: '8901230010',
    category: 'सरसफाइ',
    isActive: true
  }
];

export const DEFAULT_CUSTOMERS = [
  {
    _id: 'cust_1',
    shopId: 'shop_kirana_001',
    name: 'राम बहादुर थापा (Ram Bahadur Thapa)',
    phone: '9851011223',
    address: 'असन टोल',
    totalUdharo: 2850,
    notes: 'नियमित छिमेकी ग्राहक'
  },
  {
    _id: 'cust_2',
    shopId: 'shop_kirana_001',
    name: 'सीता देवी पौडेल (Sita Devi Paudel)',
    phone: '9841887766',
    address: 'इन्द्रचोक',
    totalUdharo: 1420,
    notes: 'महिनावारी तिर्ने'
  },
  {
    _id: 'cust_3',
    shopId: 'shop_kirana_001',
    name: 'हरि कृष्ण श्रेष्ठ (Hari Krishna)',
    phone: '9813554433',
    address: 'क्षेत्रपाटी',
    totalUdharo: 0,
    notes: 'सबै चुक्ता भयो'
  }
];

export const DEFAULT_SUPPLIERS = [
  {
    _id: 'supp_1',
    shopId: 'shop_kirana_001',
    name: 'विशाल दाल तथा तेल सप्लायर्स (Bishal Suppliers)',
    phone: '9851099887',
    address: 'कालिमाटी',
    totalPayable: 14500,
    notes: 'हप्ताको शुक्रबार भुक्तानी'
  },
  {
    _id: 'supp_2',
    shopId: 'shop_kirana_001',
    name: 'नेपाल किराना होलसेल डिस्ट्रीयूटर्स',
    phone: '9801234455',
    address: 'टेकु',
    totalPayable: 8200,
    notes: 'नगद तथा १५ दिने उधारो'
  }
];

