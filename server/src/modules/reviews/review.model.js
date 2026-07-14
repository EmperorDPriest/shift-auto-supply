import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product:           { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestName:         { type: String, trim: true },
  rating:            { type: Number, required: true, min: 1, max: 5 },
  title:             { type: String, trim: true, maxlength: 200 },
  body:              { type: String, required: true, maxlength: 2000 },
  isApproved:        { type: Boolean, default: false },
  isVerifiedPurchase:{ type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.index({ product: 1 });
reviewSchema.index({ isApproved: 1 });

// Update product rating after review save
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: Math.round(stats[0].avg * 10) / 10,
      reviewCount:   stats[0].count,
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
