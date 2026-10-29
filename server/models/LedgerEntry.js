import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema({
  _id: { type: String, default: () => 'le_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  partyType: { type: String, enum: ['Customer', 'Supplier'], required: true },
  partyId: { type: String, required: true, index: true },
  partyName: { type: String, required: true },
  direction: { type: String, enum: ['RECEIVABLE', 'PAYABLE'], required: true },
  entryType: {
    type: String,
    enum: [
      'SALE_CREDIT',      // Customer bought on credit (+ customer debt)
      'PAYMENT_RECEIVED', // Customer paid cash (- customer debt)
      'PURCHASE_CREDIT',  // Shop bought on credit (+ supplier payable)
      'PAYMENT_MADE',     // Shop paid supplier (- supplier payable)
      'RETURN_CREDIT',    // Return credit
      'ADJUSTMENT'        // Controlled manual correction
    ],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true },
  referenceSaleId: { type: String, default: null },
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now, index: true }
});

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);

