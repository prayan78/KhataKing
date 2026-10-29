import mongoose from 'mongoose';

const scanExtractedRecordSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: {
    type: String,
    enum: ['SALE_CASH', 'CUSTOMER_CREDIT', 'CUSTOMER_PAYMENT', 'SUPPLIER_PAYABLE', 'SUPPLIER_PAYMENT', 'STOCK_ITEM'],
    default: 'CUSTOMER_CREDIT'
  },
  partyName: { type: String, default: '' },
  phone: { type: String, default: '' },
  productName: { type: String, default: '' },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  rawText: { type: String, default: '' },
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'UNCERTAIN'], default: 'HIGH' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'SKIPPED'], default: 'PENDING' },
  notes: { type: String, default: '' }
}, { _id: false });

const scanBatchSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'batch_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  imageUrl: { type: String, required: true },
  extractedRecords: [scanExtractedRecordSchema],
  totalRecords: { type: Number, default: 0 },
  importedCount: { type: Number, default: 0 },
  isImported: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const ScanBatch = mongoose.model('ScanBatch', scanBatchSchema);

