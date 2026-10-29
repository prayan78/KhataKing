import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'supp_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  totalPayable: { type: Number, default: 0 }, // Positive means shop owes supplier (तिर्न बाँकी)
  notes: { type: String, default: '' },
  lastTransactionDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const Supplier = mongoose.model('Supplier', supplierSchema);

