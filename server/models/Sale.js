import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: { type: String, default: null },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'थान' }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  saleNumber: { type: String, required: true },
  idempotencyKey: { type: String, index: true },
  items: [saleItemSchema],
  grandTotal: { type: Number, required: true, min: 0 },
  paymentType: { type: String, enum: ['cash', 'credit'], required: true },
  customerId: { type: String, default: null },
  customerName: { type: String, default: 'नगद ग्राहक (Cash Customer)' },
  customerPhone: { type: String, default: '' },
  receivedAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now, index: true },
  isReturned: { type: Boolean, default: false }
});

export const Sale = mongoose.model('Sale', saleSchema);

