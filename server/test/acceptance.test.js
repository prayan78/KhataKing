import assert from 'assert';
import { store } from '../data/store.js';
import { normalizeNepaliNumbers, parseAmount, processKiranaDocument } from '../services/ocrService.js';

async function runAcceptanceTests() {
  console.log('🧪 Running KhataKing Comprehensive Acceptance Tests...\n');

  // Scenario 1: Create a product and record cash sale
  console.log('Scenario 1: Create product & record cash sale...');
  const newProd = await store.createProduct('shop_kirana_001', {
    name: 'नेपाली जिरा मसिनो चामल',
    sellingPrice: 2200,
    costPrice: 2000,
    stockQty: 20,
    unit: 'बोरा'
  });
  assert(newProd._id, 'Product should be created with an ID');
  assert.strictEqual(newProd.stockQty, 20);

  const cashSale = await store.createSale('shop_kirana_001', {
    items: [{ productId: newProd._id, name: newProd.name, quantity: 2, unitPrice: 2200, lineTotal: 4400, unit: 'बोरा' }],
    grandTotal: 4400,
    paymentType: 'cash'
  });
  assert.strictEqual(cashSale.grandTotal, 4400);
  assert.strictEqual(cashSale.paymentType, 'cash');

  const productsAfterCash = await store.getProducts('shop_kirana_001');
  const targetProd = productsAfterCash.find(p => p._id === newProd._id);
  assert.strictEqual(targetProd.stockQty, 18, 'Stock should decrease from 20 to 18');
  console.log('  ✅ Scenario 1 Passed: Product created, sale recorded, stock deducted correctly (20 -> 18).');

  // Scenario 2: Quick sale without pre-existing product
  console.log('\nScenario 2: Quick sale without pre-existing product...');
  const quickSale = await store.createSale('shop_kirana_001', {
    items: [{ productId: null, name: 'विविध किराना सामान', quantity: 1, unitPrice: 350, lineTotal: 350 }],
    grandTotal: 350,
    paymentType: 'cash'
  });
  assert.strictEqual(quickSale.grandTotal, 350);
  console.log('  ✅ Scenario 2 Passed: Quick sale recorded successfully without prior product inventory.');

  // Scenario 3: Credit sale increases customer outstanding balance and reduces stock exactly once
  console.log('\nScenario 3: Credit sale increases customer balance & deducts stock...');
  const customer = await store.createCustomer('shop_kirana_001', {
    name: 'गोविन्द प्रसाद अधिकारी',
    phone: '9841999888',
    totalUdharo: 0
  });
  const beforeStock = targetProd.stockQty; // 18

  const creditSale = await store.createSale('shop_kirana_001', {
    items: [{ productId: targetProd._id, name: targetProd.name, quantity: 3, unitPrice: 2200, lineTotal: 6600, unit: 'बोरा' }],
    grandTotal: 6600,
    paymentType: 'credit',
    customerId: customer._id,
    customerName: customer.name
  });

  const updatedCustomers = await store.getCustomers('shop_kirana_001');
  const updatedCust = updatedCustomers.find(c => c._id === customer._id);
  assert.strictEqual(updatedCust.totalUdharo, 6600, 'Customer debt should increase by 6600');

  const productsAfterCredit = await store.getProducts('shop_kirana_001');
  const prodAfterCredit = productsAfterCredit.find(p => p._id === newProd._id);
  assert.strictEqual(prodAfterCredit.stockQty, 15, 'Stock should decrease from 18 to 15');
  console.log('  ✅ Scenario 3 Passed: Credit sale increased customer debt (0 -> 6600) and deducted stock (18 -> 15).');

  // Scenario 4: Partial customer payment reduces debt without recording a second sale
  console.log('\nScenario 4: Partial payment reduces debt without recording second sale...');
  const salesBeforePayment = (await store.getSales('shop_kirana_001')).length;

  const paymentEntry = await store.addUdharoEntry('shop_kirana_001', {
    partyType: 'Customer',
    partyId: customer._id,
    amount: 2000,
    entryType: 'PAYMENT_RECEIVED',
    notes: 'आंशिक नगद बुझाएको'
  });
  assert.strictEqual(paymentEntry.balanceAfter, 4600, 'Balance should reduce from 6600 to 4600');

  const salesAfterPayment = (await store.getSales('shop_kirana_001')).length;
  assert.strictEqual(salesBeforePayment, salesAfterPayment, 'Sales count must NOT increase during credit collection');
  console.log('  ✅ Scenario 4 Passed: Partial payment of 2000 reduced debt to 4600 without creating a duplicate sale.');

  // Scenario 5 & 6: Supplier payable and payments
  console.log('\nScenario 5 & 6: Supplier payables and payment made...');
  const supplier = await store.createSupplier('shop_kirana_001', {
    name: 'नेपाल तेल भण्डार',
    totalPayable: 0
  });

  await store.addUdharoEntry('shop_kirana_001', {
    partyType: 'Supplier',
    partyId: supplier._id,
    amount: 10000,
    entryType: 'PURCHASE_CREDIT',
    notes: '१० कार्टुन तेल उधारो खरिद'
  });
  const suppliersAfterPurchase = await store.getSuppliers('shop_kirana_001');
  const sAfter = suppliersAfterPurchase.find(s => s._id === supplier._id);
  assert.strictEqual(sAfter.totalPayable, 10000);

  // Pay 4000 to supplier
  await store.addUdharoEntry('shop_kirana_001', {
    partyType: 'Supplier',
    partyId: supplier._id,
    amount: 4000,
    entryType: 'PAYMENT_MADE',
    notes: 'नगद भुक्तानी'
  });
  const suppliersAfterPay = await store.getSuppliers('shop_kirana_001');
  const sFinal = suppliersAfterPay.find(s => s._id === supplier._id);
  assert.strictEqual(sFinal.totalPayable, 6000);
  console.log('  ✅ Scenarios 5 & 6 Passed: Supplier credit purchase increased payable (10,000), payment reduced it (6,000).');

  // Scenario 7 & 8: Totals calculation & No double-counting of old debt collections
  console.log('\nScenario 7 & 8: Totals calculation & No double-counting of revenue...');
  const totals = await store.getTotals('shop_kirana_001', 'today');
  assert(totals.totalSales > 0);
  assert(totals.oldCreditCollections >= 2000, 'Old collections should be tracked separately');
  // Confirm that totalSales only counts actual sales, not old collections
  const sumOfSales = totals.cashSales + totals.creditSales;
  assert.strictEqual(totals.totalSales, sumOfSales, 'Total sales must equal cash sales + credit sales exactly');
  console.log(`  ✅ Scenario 7 & 8 Passed: Revenue (रु. ${totals.totalSales}) is cleanly separated from old debt collected (रु. ${totals.oldCreditCollections}). No double-counting!`);

  // Scenario 9: Devanagari numerals normalization
  console.log('\nScenario 9: Devanagari numerals normalization...');
  const nepaliNumStr = 'रु. १,२५०.५०';
  const parsed = parseAmount(nepaliNumStr);
  assert.strictEqual(parsed, 1250.5);
  console.log(`  ✅ Scenario 9 Passed: '${nepaliNumStr}' correctly parsed into standard float ${parsed}.`);

  // Scenario 10 & 11: OCR Scan & Uncertain flagging
  console.log('\nScenario 10 & 11: OCR Scan, uncertain flag, and safe approval...');
  const ocrResult = await processKiranaDocument('dummy.jpg', 'register.jpg');
  const uncertainRows = ocrResult.records.filter(r => r.confidence === 'UNCERTAIN');
  assert(uncertainRows.length > 0, 'Uncertain row should be flagged for manual review');
  console.log(`  ✅ Scenario 10 & 11 Passed: OCR extracted ${ocrResult.records.length} records. Uncertain rows flagged safely for user review.`);

  // Scenario 13: Duplicate prevention via idempotency key
  console.log('\nScenario 13: Duplicate submission idempotency check...');
  const idempKey = 'unique_idemp_key_123';
  const sale1 = await store.createSale('shop_kirana_001', {
    idempotencyKey: idempKey,
    items: [{ name: 'चाउचाउ', quantity: 1, unitPrice: 25, lineTotal: 25 }],
    grandTotal: 25,
    paymentType: 'cash'
  });
  const sale2 = await store.createSale('shop_kirana_001', {
    idempotencyKey: idempKey,
    items: [{ name: 'चाउचाउ', quantity: 1, unitPrice: 25, lineTotal: 25 }],
    grandTotal: 25,
    paymentType: 'cash'
  });
  assert.strictEqual(sale1._id, sale2._id, 'Double submission with same idempotency key must return same sale');
  console.log('  ✅ Scenario 13 Passed: Duplicate submission prevented. Same sale returned without double deduction.');

  console.log('\n🎉 ALL ACCEPTANCE TEST SCENARIOS PASSED WITH 100% SUCCESS!\n');
}

runAcceptanceTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
