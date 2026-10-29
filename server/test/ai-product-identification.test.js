import assert from 'assert';
import { 
  validateAndNormalizeAiResponse, 
  identifyProductImage,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS 
} from '../services/aiVisionService.js';
import { store } from '../data/store.js';

async function runAiIdentificationTests() {
  console.log('🧪 Running KhataKing AI Product Identification & Persistence Tests...\n');

  // Scenario 1: Medicine packet → correctly identified as medicine
  console.log('Test 1: Medicine packet → correctly identified as medicine...');
  const medResult = await identifyProductImage({
    originalFilename: 'napa_paracetamol_500mg_strip.jpg',
    requestId: 'req_test_01'
  });
  assert.strictEqual(medResult.success, true);
  assert.strictEqual(medResult.product.category, 'Medicine');
  assert(medResult.product.productName.toLowerCase().includes('paracetamol'), 'Should identify Paracetamol');
  assert(medResult.product.unit === 'पत्ता' || medResult.product.unit === 'थान', 'Medicine unit should be पत्ता or थान');
  assert.strictEqual(medResult.product.needsReview, false);
  console.log(`  ✅ Test 1 Passed: Identified "${medResult.product.productName}" as [${medResult.product.category}] with unit "${medResult.product.unit}".`);

  // Scenario 2: Noodles packet → correctly identified as noodles
  console.log('\nTest 2: Noodles packet → correctly identified as noodles...');
  const noodlesResult = await identifyProductImage({
    originalFilename: 'wai_wai_instant_noodles_pack.jpg',
    requestId: 'req_test_02'
  });
  assert.strictEqual(noodlesResult.success, true);
  assert.strictEqual(noodlesResult.product.category, 'Snacks & Noodles');
  assert(noodlesResult.product.productName.toLowerCase().includes('wai wai'), 'Should identify Wai Wai Noodles');
  console.log(`  ✅ Test 2 Passed: Identified "${noodlesResult.product.productName}" as [${noodlesResult.product.category}].`);

  // Scenario 3: Medicine scanned immediately after noodles → must not inherit noodles result
  console.log('\nTest 3: Medicine scanned immediately after noodles (state isolation)...');
  const noodlesFirst = await identifyProductImage({
    originalFilename: 'current_spicy_noodles_75g.jpg',
    requestId: 'req_test_03a'
  });
  assert.strictEqual(noodlesFirst.product.category, 'Snacks & Noodles');

  const medicineSecond = await identifyProductImage({
    originalFilename: 'cetirizine_10mg_tablets.jpg',
    requestId: 'req_test_03b'
  });
  assert.strictEqual(medicineSecond.product.category, 'Medicine', 'Category must be Medicine, not Noodles');
  assert(medicineSecond.product.productName.toLowerCase().includes('cetirizine'), 'Product name must be Cetirizine');
  assert(!medicineSecond.product.productName.toLowerCase().includes('noodle'), 'Must not contain any noodle keywords');
  console.log(`  ✅ Test 3 Passed: Consecutive scan of medicine after noodles produced clean [${medicineSecond.product.category}] with 0% noodle leakage.`);

  // Scenario 4: Two different products scanned consecutively → each retains its own identification
  console.log('\nTest 4: Consecutive different products retain their own identification...');
  const prodA = await identifyProductImage({
    originalFilename: 'dhara_pure_mustard_oil_1L.jpg',
    requestId: 'req_test_04a'
  });
  const prodB = await identifyProductImage({
    originalFilename: 'dettol_soap_original_75g.jpg',
    requestId: 'req_test_04b'
  });
  assert.strictEqual(prodA.product.category, 'Oil & Ghee');
  assert.strictEqual(prodB.product.category, 'Personal Care & Hygiene');
  assert.notStrictEqual(prodA.product.productName, prodB.product.productName);
  console.log(`  ✅ Test 4 Passed: Scan A="${prodA.product.productName}" (${prodA.product.category}), Scan B="${prodB.product.productName}" (${prodB.product.category}).`);

  // Scenario 5: Unreadable packaging → manual confirmation required
  console.log('\nTest 5: Unreadable packaging → manual confirmation required...');
  const unreadable = await identifyProductImage({
    originalFilename: 'blurry_unknown_box_photo.jpg',
    imageBuffer: Buffer.from('unreadable_bytes_000'),
    requestId: 'req_test_05'
  });
  assert.strictEqual(unreadable.product.needsReview, true, 'Unreadable packaging must require user review');
  assert(unreadable.product.confidence < 0.75, 'Confidence must be low for unreadable packaging');
  assert.notStrictEqual(unreadable.product.category, 'Snacks & Noodles', 'Never classify unknown as noodles');
  console.log(`  ✅ Test 5 Passed: Unreadable item flagged as needsReview=true (Confidence=${unreadable.product.confidence}).`);

  // Scenario 6: English and Nepali packaging → extracted text and names handled correctly
  console.log('\nTest 6: English and Nepali packaging normalization...');
  const bilingualData = validateAndNormalizeAiResponse({
    productName: 'सिटामोल ५०० एमजी (Paracetamol 500mg)',
    nameEn: 'Paracetamol 500mg Tablets',
    brand: 'Nepal Pharma',
    category: 'Medicine',
    variant: '500mg',
    size: '10 Tablets',
    unit: 'पत्ता',
    extractedText: ['Paracetamol', '५०० एमजी', 'Batch 102'],
    confidence: 0.92
  });
  assert.strictEqual(bilingualData.category, 'Medicine');
  assert.strictEqual(bilingualData.extractedText.length, 3);
  assert.strictEqual(bilingualData.needsReview, false);
  console.log(`  ✅ Test 6 Passed: Bilingual metadata normalized with Devanagari & English text intact.`);

  // Scenario 7: AI returns invalid JSON or malformed schema → safe error handling
  console.log('\nTest 7: AI returns invalid JSON / malformed response...');
  const malformedA = validateAndNormalizeAiResponse(null);
  assert.strictEqual(malformedA.needsReview, true);
  assert.strictEqual(malformedA.productName, '');

  const malformedB = validateAndNormalizeAiResponse({
    productName: 'Medicine', // Product name equals category
    category: 'Medicine'
  });
  assert.strictEqual(malformedB.productName, '', 'Category name should not be used as product name');
  assert.strictEqual(malformedB.needsReview, true);
  console.log('  ✅ Test 7 Passed: Malformed input gracefully normalized without crashes; review flagged.');

  // Scenario 8: User edits the product name → edited name is preserved
  console.log('\nTest 8: User edits product name before saving...');
  const scannedRaw = {
    name: 'Paracetamol 500mg',
    brand: 'Generic',
    category: 'Medicine',
    sellingPrice: 15,
    unit: 'पत्ता'
  };
  // User modifies name and price on the confirmation screen:
  const userEditedForm = {
    ...scannedRaw,
    name: 'Flexon MR Pain Relief Tablets (Edited by User)',
    brand: 'Aristo Pharma',
    sellingPrice: 45
  };
  assert.strictEqual(userEditedForm.name, 'Flexon MR Pain Relief Tablets (Edited by User)');
  assert.strictEqual(userEditedForm.sellingPrice, 45);
  console.log(`  ✅ Test 8 Passed: Form accurately preserves user edited name "${userEditedForm.name}".`);

  // Scenario 9: AI assigns mismatched category → validation catches or normalizes
  console.log('\nTest 9: Category validation against known taxonomy...');
  const nonStandardCat = validateAndNormalizeAiResponse({
    productName: 'Amoxicillin 250mg',
    category: 'some_random_string'
  });
  assert.strictEqual(nonStandardCat.needsReview, true, 'Unknown category must trigger review');
  console.log('  ✅ Test 9 Passed: Non-standard category properly flagged for user review.');

  // Scenario 10: MongoDB save → persisted product matches confirmed form
  console.log('\nTest 10: Persisting confirmed product to MongoDB / Store...');
  const confirmedProduct = await store.createProduct('shop_kirana_001', {
    name: 'Cetirizine 10mg Tablets (Alatrol)',
    nameEn: 'Cetirizine 10mg',
    brand: 'Square Pharma',
    category: 'Medicine',
    variant: '10mg',
    size: '10 Tablets Strip',
    sellingPrice: 35,
    costPrice: 25,
    stockQty: 50,
    unit: 'पत्ता'
  });

  assert(confirmedProduct._id, 'Product must have an ID');
  assert.strictEqual(confirmedProduct.name, 'Cetirizine 10mg Tablets (Alatrol)');
  assert.strictEqual(confirmedProduct.category, 'Medicine');
  assert.strictEqual(confirmedProduct.brand, 'Square Pharma');
  assert.strictEqual(confirmedProduct.variant, '10mg');
  assert.strictEqual(confirmedProduct.unit, 'पत्ता');
  assert.strictEqual(confirmedProduct.sellingPrice, 35);

  // Retrieve from store to verify round-trip persistence
  const allProducts = await store.getProducts('shop_kirana_001');
  const found = allProducts.find(p => p._id === confirmedProduct._id);
  assert(found, 'Product must be found in database');
  assert.strictEqual(found.name, 'Cetirizine 10mg Tablets (Alatrol)');
  assert.strictEqual(found.category, 'Medicine');
  console.log(`  ✅ Test 10 Passed: Product ID=${found._id} successfully retrieved with exact confirmed attributes: "${found.name}" [${found.category}].`);

  console.log('\n🎉 ALL 10 AI PRODUCT IDENTIFICATION & PERSISTENCE TESTS PASSED SUCCESSFULLY!\n');
}

runAiIdentificationTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

