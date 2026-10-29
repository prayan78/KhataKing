import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(7) },
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  nameEn: { type: String, default: '' },
  sellingPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  stockQty: { type: Number, default: 0 },
  unit: { type: String, default: 'थान' }, // थान, पोका, के.जी., ग्राम, लिटर, बोतल, दर्जन
  minStockAlert: { type: Number, default: 5 },
  barcode: { type: String, default: '' },
  category: { type: String, default: 'किराना' },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model('Product', productSchema);

