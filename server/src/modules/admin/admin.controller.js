import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Order from '../orders/order.model.js';
import Product from '../products/product.model.js';
import User from '../users/user.model.js';
import Review from '../reviews/review.model.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

  const [
    totalOrders, pendingReview, revenueData,
    totalProducts, lowStock, totalUsers,
    recentOrders, topProducts, pendingReviews,
    ordersByStatus, revenueByDay,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: 'under_review' }),
    Order.aggregate([
      { $match: { paymentStatus: 'confirmed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $lte: 5, $gt: 0 }, isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Order.find().sort('-createdAt').limit(10).lean(),
    Product.find({ isActive: true }).sort('-viewCount').limit(5).select('name viewCount salesCount price images').lean(),
    Review.countDocuments({ isApproved: false }),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'confirmed', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return ApiResponse.success(res, {
    overview: {
      totalOrders,
      pendingPaymentReview: pendingReview,
      revenue30d:   revenueData[0]?.total || 0,
      orders30d:    revenueData[0]?.count || 0,
      totalProducts,
      lowStockProducts: lowStock,
      totalCustomers: totalUsers,
      pendingReviews,
    },
    recentOrders,
    topProducts,
    ordersByStatus,
    revenueByDay,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [
    { name:  { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
  ];

  const pageNum  = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip     = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    User.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    users,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const update = {};
  if (isActive !== undefined) update.isActive = isActive;
  if (role)                   update.role = role;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) throw ApiError.notFound('User not found');

  return ApiResponse.success(res, user, 'User updated');
});
