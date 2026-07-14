import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Review from './review.model.js';

export const getReviews = asyncHandler(async (req, res) => {
  const { product, page = 1, limit = 10 } = req.query;
  const filter = { isApproved: true };
  if (product) filter.product = product;

  const pageNum  = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip     = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    reviews,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, body, guestName } = req.body;

  if (!productId || !rating || !body) 
    throw ApiError.badRequest('Product, rating, and review body are required');

  if (rating < 1 || rating > 5) 
    throw ApiError.badRequest('Rating must be between 1 and 5');

  const review = await Review.create({
    product:   productId,
    user:      req.user?._id || null,
    guestName: req.user ? null : guestName,
    rating:    parseInt(rating),
    title,
    body,
    isApproved: false, // Admin moderation
  });

  return ApiResponse.created(res, review, 'Review submitted. It will appear after moderation.');
});

export const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!review) throw ApiError.notFound('Review not found');
  return ApiResponse.success(res, review, 'Review approved');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  return ApiResponse.success(res, null, 'Review deleted');
});
