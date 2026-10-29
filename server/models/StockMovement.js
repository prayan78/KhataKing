import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'sm_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  type: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'MANUAL_ADD', 'MANUAL_REDUCE', 'RETURN'],
    required: true
  },
  delta: { type: Number, required: true }, // positive for add, negative for deduction
  beforeQty: { type: Number, required: true },
  afterQty: { type: Number, required: true },
  reason: { type: String, default: '' },
  referenceId: { type: String, default: null },
  date: { type: Date, default: Date.now, index: true }
});

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);

