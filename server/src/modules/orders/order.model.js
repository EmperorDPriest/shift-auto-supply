import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:     { type: String, required: true },
  sku:      { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image:    { type: String },
}, { _id: true });

const shippingSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   { type: String },
  street:  { type: String, required: true },
  city:    { type: String, required: true },
  state:   { type: String, default: '' },
  country: { type: String, required: true },
  zip:     { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail:  { type: String, default: null },
  items:       { type: [orderItemSchema], required: true },
  shipping:    { type: shippingSchema, required: true },
  subtotal:    { type: Number, required: true },
  shippingCost:{ type: Number, default: 0 },
  total:       { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['zelle', 'paypal', 'cashapp', 'applepay', 'creditcard'], 
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'under_review', 'confirmed', 'failed'],
    default: 'pending',
  },
  paymentProof: {
    url:        { type: String },
    publicId:   { type: String },
    uploadedAt: { type: Date },
    note:       { type: String },
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  tracking: {
    number:    { type: String },
    provider:  { type: String },
    url:       { type: String },
    shippedAt: { type: Date },
  },
  adminNotes: { type: String },
  statusHistory: [{
    status:    { type: String },
    note:      { type: String },
    changedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const timestamp = Date.now().toString(36).toUpperCase();
    this.orderNumber = `SAS-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ user: 1 });
orderSchema.index({ guestEmail: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
