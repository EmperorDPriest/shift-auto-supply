import mongoose from 'mongoose';

const vehicleCompatSchema = new mongoose.Schema({
  brand:    { type: String, required: true },
  model:    { type: String, required: true },
  yearFrom: { type: Number },
  yearTo:   { type: Number },
  engine:   { type: String },
}, { _id: false });

const specificationSchema = new mongoose.Schema({
  key:   { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const imageSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  publicId: { type: String },
  alt:      { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:               { type: String, required: true, trim: true, maxlength: 300 },
  slug:               { type: String, unique: true, lowercase: true },
  sku:                { type: String, required: true, unique: true, uppercase: true, trim: true },
  brand:              { type: String, required: true, trim: true },
  compatibleBrands:   [{ type: String, trim: true }],
  vehicleModels:      [vehicleCompatSchema],
  vinCompatibility:   [{ type: String, uppercase: true }],
  category:           { type: String, required: true },
  subcategory:        { type: String },
  condition:          { type: String, enum: ['new', 'used', 'refurbished'], default: 'new' },
  price:              { type: Number, required: true, min: 0 },
  salePrice:          { type: Number, min: 0, default: null },
  stock:              { type: Number, required: true, min: 0, default: 0 },
  images:             { type: [imageSchema], validate: [(arr) => arr.length <= 2, 'Max 2 images allowed'] },
  description:        { type: String, required: true },
  specifications:     [specificationSchema],
  tags:               [{ type: String, lowercase: true, trim: true }],
  isFeatured:         { type: Boolean, default: false },
  viewCount:          { type: Number, default: 0 },
  salesCount:         { type: Number, default: 0 },
  averageRating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:        { type: Number, default: 0 },
  seo: {
    title:       { type: String },
    description: { type: String },
    keywords:    [{ type: String }],
  },
  isActive:           { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: effective price
productSchema.virtual('effectivePrice').get(function () {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

productSchema.virtual('isOnSale').get(function () {
  return this.salePrice != null && this.salePrice < this.price;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.isOnSale) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

// Indexes for search performance
productSchema.index({ name: 'text', sku: 'text', tags: 'text', 'vehicleModels.model': 'text' });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'vehicleModels.brand': 1, 'vehicleModels.model': 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
