import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  _id: { type: String, default: 'shop_kirana_001' },
  name: { type: String, required: true, default: 'हाम्रो किराना पसल' },
  ownerName: { type: String, default: 'साहूजी' },
  phone: { type: String, default: '9800000000' },
  address: { type: String, default: 'काठमाडौँ, नेपाल' },
  panNumber: { type: String, default: '' },
  currency: { type: String, default: 'NPR' },
  language: { type: String, default: 'ne' },
  createdAt: { type: Date, default: Date.now },
});

export const Shop = mongoose.model('Shop', shopSchema);

