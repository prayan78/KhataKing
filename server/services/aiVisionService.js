/**
 * Image-to-Text OCR and Smart Product Title Recognition Service for KhataKing
 * Uses local Tesseract.js engine to extract text directly from image pixels,
 * and an intelligent packaging parser to identify the true Product Title, Brand,
 * Category, Variant/Strength, Size, and Price.
 */

import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';

// Standardized Kirana & Retail Categories
export const PRODUCT_CATEGORIES = [
  'Medicine',                   // औषधि (Tablets, Syrups, Blister strips, Ointments)
  'Food & Grains',              // खाद्यान्न (Rice, Pulses, Flour, Beaten rice)
  'Snacks & Noodles',           // खाजा तथा चाउचाउ (Noodles, Chips, Kurkure)
  'Biscuits & Bakery',          // बिस्कुट तथा बेकरी (Cookies, Bread, Buns)
  'Beverages',                  // पेयपदार्थ (Tea, Coffee, Juice, Soft drinks, Energy drinks)
  'Oil & Ghee',                 // तेल तथा घ्यू (Mustard oil, Sunflower oil, Dalda, Ghee)
  'Dairy',                      // डेरी (Milk, Curd, Paneer, Cheese)
  'Personal Care & Hygiene',    // व्यक्तिगत सरसफाइ (Soap, Shampoo, Toothpaste, Creams)
  'Household & Cleaning',       // घरायसी तथा सरसफाइ (Detergent, Floor cleaner, Dishwash)
  'Spices & Masala',            // मसला (Turmeric, Cumin, Garam masala, Salt)
  'Baby Care',                  // शिशु स्याहार (Diapers, Baby food, Wipes)
  'General Kirana',             // सामान्य किराना
  'Other'                       // अन्य
];

// Standard Units in Nepal
export const PRODUCT_UNITS = [
  'थान',      // Piece
  'पत्ता',    // Blister Strip (Medicine)
  'पोका',     // Packet
  'बोतल',     // Bottle
  'बट्टा',    // Box / Carton
  'के.जी.',   // Kilogram
  'ग्राम',    // Gram
  'लिटर',     // Liter
  'दर्जन'     // Dozen
];

// Common noise patterns in product packaging that are NOT product titles
const NOISE_LINE_PATTERNS = [
  /\b(mfg|mfd|exp|expiry|manufactur|pkd|packed|batch|lot|b\.?no|date)\b/i,
  /\b(keep\s*out|children|storage|store\s*in|cool\s*dry|external\s*use|schedule\s*[hxg]|rx\s*only|license|lic\s*no|warning|caution|dosage|direction|composition)\b/i,
  /\b(pvt\.?\s*ltd\.?|limited|ltd\.?|industries|laboratories|pharmaceuticals\s*ltd|marketed\s*by|manufactured\s*by|distributor)\b/i,
  /\b(net\s*wt|net\s*quantity|ingredients|nutrition|facts|energy|protein|carbohydrate|fat)\b/i,
  /\b(m\.?r\.?p\.?|max\.?\s*retail|incl\.?\s*of\s*all\s*taxes|mrp\s*rs)\b/i,
  /^[\d\s\-_.:/\\,]+$/
];

// Common known brands in Nepal Kirana & Pharmacy
const KNOWN_BRANDS = [
  'Lotte', 'Orion', 'Cadbury', 'Nestle',
  'Napa', 'Beximco', 'Square', 'Aristo', 'Deurali', 'Apex', 'Cipla', 'Sun Pharma',
  'Wai Wai', 'Rara', 'Current', '2PM', 'Maggi', 'Chaudhary Group', 'CG',
  'Dhara', 'Amrit', 'Fortune', 'Saffola',
  'Parle-G', 'Good Day', 'Britannia', 'Oreo', 'Marie',
  'Dettol', 'Lifebuoy', 'Lux', 'Colgate', 'Closeup', 'Pepsodent', 'Sunsilk', 'Clinic Plus', 'Dove',
  'Tokla', 'Mechi', 'Red Bull', 'Coca-Cola', 'Coke', 'Fanta', 'Sprite', 'Pepsi', 'Frooti', 'Real'
];

/**
 * Clean OCR lines by stripping noise symbols (.-|, pipes, dashes, bullets)
 * and correcting known cursive packaging font misreadings (e.g. Chiocopie -> Chocopie).
 */
export const cleanOcrTextLine = (line = '') => {
  if (!line) return '';
  let cleaned = line
    // Replace vertical pipes, tilde, underscores, slashes, em-dashes with spaces
    .replace(/[|~_—–\\/]+/g, ' ')
    // Strip trailing and leading punctuation / noise symbols (., -, |, :, ;)
    .replace(/^[\s.\-_:;,\/\\|]+|[\s.\-_:;,\/\\|]+$/g, '')
    // Fix common OCR cursive packaging font misreadings
    .replace(/\bchiocopie\b/gi, 'Chocopie')
    .replace(/\bchokopie\b/gi, 'Chocopie')
    .replace(/\bchocopi\b/gi, 'Chocopie')
    .replace(/\bchioco\s*pie\b/gi, 'Choco Pie')
    .replace(/\bwal\s*wal\b/gi, 'Wai Wai')
    .replace(/\bcurent\b/gi, 'Current')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip any trailing non-word / punctuation characters remaining (like ".-|" or ".-")
  cleaned = cleaned.replace(/[\s.\-_:;,\/\\|]+$/g, '').trim();
  return cleaned;
};

/**
 * Check if buffer has valid image magic bytes (JPEG, PNG, WEBP, GIF)
 */
export const isValidImageInput = (input) => {
  if (!input) return false;
  let buf = null;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === 'string' && fs.existsSync(input)) {
    try {
      buf = fs.readFileSync(input);
    } catch (e) {
      return false;
    }
  }
  if (!buf || buf.length < 32) return false;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  // WEBP: RIFF ... WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true;

  return false;
};

/**
 * Perform Image-to-Text OCR using Tesseract.js directly on image pixels
 */
export const performImageToTextOcr = async (imageInput) => {
  if (!isValidImageInput(imageInput)) {
    console.log('[OCR_SKIP] Input is not a valid JPEG/PNG/WEBP image, skipping OCR engine.');
    return '';
  }

  try {
    const { data } = await Tesseract.recognize(imageInput, 'eng', {
      logger: () => {} // quiet logger
    });
    return data?.text || '';
  } catch (err) {
    console.warn('[OCR_ENGINE_WARNING] Tesseract failed safely:', err.message);
    return '';
  }
};

/**
 * Smart Title & Field Extraction from OCR Text
 * Analyzes packaging lines to identify the actual Product Title, Brand, Category,
 * Strength/Variant, Size, Price, and Unit.
 */
export const smartRecognizeProductFromOcrText = (rawOcrText = '', filename = '') => {
  const allLines = rawOcrText
    .split(/\r?\n/)
    .map(line => cleanOcrTextLine(line))
    .filter(line => line.length > 1);

  const fullCorpus = (filename + ' ' + rawOcrText).toLowerCase();
  const normalizedCorpus = fullCorpus.replace(/[^a-z0-9\u0900-\u097F]+/g, ' ');

  // 1. Extract Price if MRP / Rs. is visible
  let suggestedSellingPrice = null;
  const priceMatch = rawOcrText.match(/(?:mrp|m\.r\.p\.?|price|rs\.?|रु\.?|₹)\s*:?\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    const p = parseFloat(priceMatch[1]);
    if (!isNaN(p) && p > 0 && p < 100000) {
      suggestedSellingPrice = p;
    }
  }

  // 2. Extract Strength / Variant (e.g. 500mg, 10mg, 75g, 1L, etc.)
  let variant = '';
  const variantMatch = rawOcrText.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|ml|l|ltr|gm|g|kg))\b/i);
  if (variantMatch) {
    variant = variantMatch[1].replace(/\s+/g, '');
  }

  // 3. Extract Size / Pack count (e.g. 10 Tablets, 10 Strips, 100ml, 75g)
  let size = '';
  const sizeMatch = rawOcrText.match(/\b(\d+\s*(?:tablets?|capsules?|strips?|pcs|थान|पत्ता|पोका))\b/i);
  if (sizeMatch) {
    size = sizeMatch[1];
  } else if (variant) {
    size = variant;
  }

  // 4. Identify Brand from known list or capitalized lead words
  let brand = '';
  for (const b of KNOWN_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(rawOcrText) || new RegExp(`\\b${b}\\b`, 'i').test(filename)) {
      brand = b;
      break;
    }
  }

  // Filter out noise lines to find candidate title lines
  const cleanCandidateLines = allLines.filter(line => {
    return !NOISE_LINE_PATTERNS.some(pattern => pattern.test(line));
  });

  // 5. Intelligent Title & Category Recognition
  let productName = '';
  let category = 'Other';
  let unit = 'थान';
  let confidence = 0.5;

  // --- Check Category A: Medicine ---
  const isMedicine = /\b(paracetamol|cetirizine|amoxicillin|napa|flexon|sinex|antacid|azithromycin|metformin|ibuprofen|omeprazole|pantoprazole|atorvastatin|cough|syrup|tablet|tablets|capsule|capsules|strip|mg|mcg|ointment|pharma|pharmaceutical|blister)\b/i.test(normalizedCorpus);
  if (isMedicine) {
    category = 'Medicine';
    unit = 'पत्ता'; // Blister strip by default for medicines
    confidence = 0.88;

    // Detect specific drug name
    let drugName = '';
    if (normalizedCorpus.includes('paracetamol')) drugName = 'Paracetamol';
    else if (normalizedCorpus.includes('cetirizine')) drugName = 'Cetirizine';
    else if (normalizedCorpus.includes('amoxicillin')) drugName = 'Amoxicillin';
    else if (normalizedCorpus.includes('azithromycin')) drugName = 'Azithromycin';
    else if (normalizedCorpus.includes('ibuprofen') || normalizedCorpus.includes('flexon')) drugName = 'Flexon';
    else if (normalizedCorpus.includes('syrup')) {
      drugName = 'Cough Syrup';
      unit = 'बोतल';
    }

    // Build smart title: Brand + Drug + Strength (e.g. "Napa Paracetamol 500mg")
    const titleParts = [];
    if (brand && !drugName.toLowerCase().includes(brand.toLowerCase())) {
      titleParts.push(brand);
    }
    if (drugName) {
      titleParts.push(drugName);
    } else {
      // Find the best clean line that represents the medicine name
      const medLine = cleanCandidateLines.find(l => /\b(mg|tablets?|capsules?|syrup)\b/i.test(l)) || cleanCandidateLines[0];
      if (medLine) titleParts.push(medLine);
    }
    if (variant && !titleParts.some(p => p.toLowerCase().includes(variant.toLowerCase()))) {
      titleParts.push(variant);
    }
    if (size && !variant && !titleParts.some(p => p.toLowerCase().includes(size.toLowerCase()))) {
      titleParts.push(size);
    }

    productName = titleParts.join(' ').trim();
    if (!suggestedSellingPrice) suggestedSellingPrice = 20;
  }

  // --- Check Category B: Snacks & Noodles ---
  else if (/\b(wai\s*wai|rara|current|2pm|noodles|chowmein|maggi)\b/i.test(normalizedCorpus)) {
    category = 'Snacks & Noodles';
    unit = 'पोका';
    confidence = 0.90;

    let noodleName = 'Instant Noodles';
    if (normalizedCorpus.includes('wai wai')) {
      brand = brand || 'Wai Wai';
      noodleName = 'Instant Noodles';
    } else if (normalizedCorpus.includes('current')) {
      brand = brand || 'Current';
      noodleName = 'Hot & Spicy Noodles';
    } else if (normalizedCorpus.includes('rara')) {
      brand = brand || 'Rara';
      noodleName = 'White Noodles';
    } else if (normalizedCorpus.includes('2pm')) {
      brand = brand || '2PM';
      noodleName = 'Spicy Noodles';
    }

    const titleParts = [brand, noodleName, variant || size || '75g'].filter(Boolean);
    productName = titleParts.join(' ').trim();
    if (!suggestedSellingPrice) suggestedSellingPrice = 25;
  }

  // --- Check Category C: Oil & Ghee ---
  else if (/\b(dhara|mustard\s*oil|sunflower|soybean|ghee|dalda|cooking\s*oil)\b/i.test(normalizedCorpus)) {
    category = 'Oil & Ghee';
    unit = 'बोतल';
    confidence = 0.85;
    brand = brand || 'Dhara';
    let oilType = 'Pure Mustard Oil';
    if (normalizedCorpus.includes('sunflower')) oilType = 'Sunflower Oil';
    else if (normalizedCorpus.includes('soybean')) oilType = 'Soybean Oil';
    else if (normalizedCorpus.includes('ghee')) { oilType = 'Pure Ghee'; unit = 'बट्टा'; }

    productName = `${brand} ${oilType} ${variant || size || '1L'}`.trim();
    if (!suggestedSellingPrice) suggestedSellingPrice = 260;
  }

  // --- Check Category D: Biscuits, Bakery & Confectionery (Choco Pie, Cookies, Biscuits) ---
  else if (/\b(chocopie|choco\s*pie|chiocopie|lotte|orion|parle|good\s*day|biscuit|cookie|cookies|oreo|marie|bakery|bread)\b/i.test(normalizedCorpus)) {
    category = 'Biscuits & Bakery';
    unit = 'बट्टा';
    confidence = 0.92;

    if (/\b(chocopie|choco\s*pie|chiocopie|lotte|orion)\b/i.test(normalizedCorpus)) {
      brand = brand || (normalizedCorpus.includes('orion') ? 'Orion' : 'Lotte');
      unit = normalizedCorpus.includes('पोका') ? 'पोका' : 'बट्टा';
      productName = `${brand} Choco Pie ${variant || size || ''}`.trim();
      if (!suggestedSellingPrice) suggestedSellingPrice = 180;
    } else {
      brand = brand || 'Parle-G';
      unit = 'पोका';
      const bLine = cleanCandidateLines.find(l => /\b(biscuit|cookie|cookies|glucose)\b/i.test(l)) || 'Biscuits';
      productName = `${brand} ${bLine}`.trim();
      if (!suggestedSellingPrice) suggestedSellingPrice = 20;
    }
  }

  // --- Check Category E: Personal Care & Hygiene ---
  else if (/\b(dettol|lifebuoy|lux|colgate|closeup|sunsilk|clinic\s*plus|soap|shampoo|toothpaste)\b/i.test(normalizedCorpus)) {
    category = 'Personal Care & Hygiene';
    unit = 'थान';
    confidence = 0.85;
    let itemType = 'Soap';
    if (normalizedCorpus.includes('colgate') || normalizedCorpus.includes('toothpaste') || normalizedCorpus.includes('closeup')) {
      itemType = 'Toothpaste';
    } else if (normalizedCorpus.includes('shampoo')) {
      itemType = 'Shampoo';
    }
    productName = `${brand || 'Dettol'} ${itemType} ${variant || size || ''}`.trim();
    if (!suggestedSellingPrice) suggestedSellingPrice = 60;
  }

  // --- Check Category F: Beverages ---
  else if (/\b(tea|chiya|red\s*bull|coke|coca\s*cola|fanta|sprite|frooti|juice)\b/i.test(normalizedCorpus)) {
    category = 'Beverages';
    unit = normalizedCorpus.includes('tea') ? 'पोका' : 'थान';
    confidence = 0.85;
    let bev = 'Tea';
    if (normalizedCorpus.includes('red bull')) bev = 'Red Bull Can 250ml';
    else if (normalizedCorpus.includes('coke') || normalizedCorpus.includes('coca')) bev = 'Coca-Cola 500ml';
    else if (normalizedCorpus.includes('frooti')) bev = 'Frooti Mango Drink';
    productName = `${brand || ''} ${bev}`.trim();
  }

  // --- Fallback: Extract the most prominent clean line from OCR ---
  if (!productName && cleanCandidateLines.length > 0) {
    // Pick the first clean line that is descriptive
    productName = cleanCandidateLines[0];
    if (cleanCandidateLines.length > 1 && cleanCandidateLines[0].length < 15 && !cleanCandidateLines[0].includes(' ')) {
      // Line 1 might be a brand, Line 2 might be the product
      productName = `${cleanCandidateLines[0]} ${cleanCandidateLines[1]}`;
    }
    category = 'General Kirana';
    unit = 'थान';
    confidence = 0.65;
  }

  // If still no title could be extracted:
  const needsReview = Boolean(!productName || confidence < 0.75 || category === 'Other');

  const finalCleanTitle = cleanOcrTextLine(productName);
  return {
    productName: finalCleanTitle,
    nameEn: finalCleanTitle,
    brand: cleanOcrTextLine(brand),
    category,
    variant: cleanOcrTextLine(variant),
    size: cleanOcrTextLine(size),
    unit,
    barcode: null,
    extractedText: allLines.map(l => cleanOcrTextLine(l)).filter(Boolean),
    confidence,
    needsReview,
    suggestedSellingPrice,
    suggestedCostPrice: suggestedSellingPrice ? Math.round(suggestedSellingPrice * 0.85) : null
  };
};

/**
 * Main Product Identification Function
 * 1. Executes Image-to-Text OCR on the actual image file
 * 2. Runs the smart packaging parser to identify the true Product Title & attributes
 * 3. Returns the structured product data ready for form filling
 */
export const identifyProductImage = async ({
  filePath = '',
  imageBuffer = null,
  originalFilename = 'product.jpg',
  mimeType = 'image/jpeg',
  requestId = 'req_' + Date.now()
}) => {
  console.log(`[OCR_SCAN_START] requestId=${requestId} file="${originalFilename}" mimeType="${mimeType}"`);

  let buffer = imageBuffer;
  if (!buffer && filePath && fs.existsSync(filePath)) {
    try {
      buffer = fs.readFileSync(filePath);
    } catch (e) {
      console.warn(`[OCR_FILE_READ_ERR] Could not read file ${filePath}:`, e.message);
    }
  }

  // Step 1: Perform Real Image-to-Text OCR using Tesseract
  let ocrText = '';
  if (filePath && fs.existsSync(filePath)) {
    console.log(`[OCR_RUNNING] Running Tesseract OCR on file: ${filePath}`);
    ocrText = await performImageToTextOcr(filePath);
  } else if (buffer) {
    console.log(`[OCR_RUNNING] Running Tesseract OCR on image buffer (${buffer.length} bytes)`);
    ocrText = await performImageToTextOcr(buffer);
  }

  console.log(`[OCR_OUTPUT] requestId=${requestId} textLength=${ocrText.length} preview="${ocrText.substring(0, 80).replace(/\n/g, ' ')}"`);

  // Step 2: Smart Recognition of Product Title & Attributes from OCR Text
  const result = smartRecognizeProductFromOcrText(ocrText, originalFilename);

  console.log(`[SMART_PRODUCT_IDENTIFIED] requestId=${requestId} Title: "${result.productName || '(Unrecognized)'}" | Category: "${result.category}" | Conf: ${result.confidence}`);

  return {
    success: true,
    requestId,
    provider: 'image_to_text_ocr',
    product: result
  };
};

export const validateAndNormalizeAiResponse = (raw, rawText = '') => {
  if (!raw || typeof raw !== 'object') {
    return {
      productName: '',
      nameEn: '',
      brand: '',
      category: 'Other',
      variant: '',
      size: '',
      unit: 'थान',
      barcode: null,
      extractedText: [],
      confidence: 0,
      needsReview: true
    };
  }

  let name = String(raw.productName || raw.name || '').trim();
  const categoryCandidate = String(raw.category || '').trim();

  // Guard against using category as product name
  if (name.toLowerCase() === categoryCandidate.toLowerCase() || name.toLowerCase() === 'product' || name.toLowerCase() === 'item') {
    name = '';
  }

  const matchedCategory = PRODUCT_CATEGORIES.find(c => 
    c.toLowerCase() === categoryCandidate.toLowerCase()
  );
  const category = matchedCategory || (categoryCandidate === 'Medicine' ? 'Medicine' : 'Other');

  const conf = typeof raw.confidence === 'number' ? raw.confidence : 0.5;
  const needsReview = Boolean(raw.needsReview || !name || conf < 0.75 || category === 'Other');

  return {
    productName: name,
    nameEn: raw.nameEn || name,
    brand: raw.brand || '',
    category,
    variant: raw.variant || '',
    size: raw.size || '',
    unit: raw.unit || 'थान',
    barcode: raw.barcode || null,
    extractedText: Array.isArray(raw.extractedText) ? raw.extractedText : (rawText ? rawText.split('\n') : []),
    confidence: conf,
    needsReview
  };
};
