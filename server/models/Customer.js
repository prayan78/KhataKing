import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  totalUdharo: { type: Number, default: 0 }, // Positive means customer owes us money (उठाउन बाँकी)
  notes: { type: String, default: '' },
  lastTransactionDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const Customer = mongoose.model('Customer', customerSchema);

