import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Order from './order.model.js';
import { sendNewOrderNotification, sendOrderConfirmationToCustomer } from '../../utils/email.js';
import Product from '../products/product.model.js';
import { uploadToCloudinary } from '../../middleware/upload.middleware.js';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shipping, paymentMethod, guestEmail } = req.body;

  if (!items?.length) throw ApiError.badRequest('Order must contain at least one item');
  if (!shipping)       throw ApiError.badRequest('Shipping information is required');
  if (!paymentMethod)  throw ApiError.badRequest('Payment method is required');

  const userId = req.user?._id || null;
  if (!userId && !guestEmail) throw ApiError.badRequest('Email is required for guest checkout');

  // Validate items and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) 
      throw ApiError.badRequest(`Product "${item.name || item.productId}" not available`);
    if (product.stock < item.quantity) 
      throw ApiError.badRequest(`Insufficient stock for "${product.name}". Available: ${product.stock}`);

    const price = product.salePrice && product.salePrice < product.price 
      ? product.salePrice 
      : product.price;

    orderItems.push({
      product:  product._id,
      name:     product.name,
      sku:      product.sku,
      price,
      quantity: item.quantity,
      image:    product.images[0]?.url || null,
    });

    subtotal += price * item.quantity;
  }

  const shippingCost = 0; // Shipping arranged personally by owner after order
  const total = subtotal;

  // Reduce stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity, salesCount: item.quantity }
    });
  }

  const order = await Order.create({
    user:          userId,
    guestEmail:    userId ? null : guestEmail,
    items:         orderItems,
    shipping,
    subtotal,
    shippingCost,
    total,
    paymentMethod,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  return ApiResponse.created(res, {
    orderId:     order._id,
    orderNumber: order.orderNumber,
    total:       order.total,
    paymentMethod: order.paymentMethod,
  }, 'Order placed successfully');
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum  = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip     = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return ApiResponse.success(res, {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw ApiError.notFound('Order not found');

  // Authorization: must be owner, admin, or guest with matching email
  const isOwner = req.user && order.user?.toString() === req.user._id.toString();
  const isAdmin = req.user?.role === 'admin';
  // For guest, they'll use order tracking endpoint

  if (!isOwner && !isAdmin) {
    // Return limited info for security
    throw ApiError.forbidden('Access denied');
  }

  return ApiResponse.success(res, order);
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    .select('-paymentProof.publicId -adminNotes')
    .lean();

  if (!order) throw ApiError.notFound('Order not found. Please check your order number.');

  // Return safe subset of order data for public tracking
  const safeOrder = {
    orderNumber:   order.orderNumber,
    orderStatus:   order.orderStatus,
    paymentStatus: order.paymentStatus,
    items:         order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    total:         order.total,
    tracking:      order.tracking,
    statusHistory: order.statusHistory,
    createdAt:     order.createdAt,
    shipping: {
      name:    order.shipping.name,
      city:    order.shipping.city,
      country: order.shipping.country,
    },
  };

  return ApiResponse.success(res, safeOrder);
});

export const uploadPaymentProof = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.paymentStatus === 'confirmed')
    throw ApiError.badRequest('Payment already confirmed for this order');

  // Allow submission with or without a file. If file present, upload to cloudinary.
  const note = req.body.note || '';
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'payment-proofs');
    order.paymentProof = {
      url:        result.url,
      publicId:   result.publicId,
      uploadedAt: new Date(),
      note,
    };
  } else {
    // Customer indicated they paid but didn't upload a file — create a record with note
    order.paymentProof = {
      url:        null,
      publicId:   null,
      uploadedAt: new Date(),
      note,
    };
  }
  order.paymentStatus = 'under_review';
  order.statusHistory.push({
    status: 'under_review',
    note:   'Payment proof uploaded — awaiting verification',
  });

  await order.save();

  return ApiResponse.success(res, {
    orderNumber:   order.orderNumber,
    paymentStatus: order.paymentStatus,
  }, 'Payment proof submitted. Our team will verify shortly.');
});

export const downloadPaymentProof = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.paymentProof?.url) throw ApiError.notFound('Payment proof not available');

  const proofUrl = order.paymentProof.url;
  const download = String(req.query.download || '').toLowerCase() === 'true';

  const cloudinaryResponse = await fetch(proofUrl);
  if (!cloudinaryResponse.ok) {
    throw ApiError.badRequest('Unable to retrieve payment proof from Cloudinary');
  }

  const contentType = cloudinaryResponse.headers.get('content-type') || 'application/octet-stream';
  const contentLength = cloudinaryResponse.headers.get('content-length');
  const extension = proofUrl.split('.').pop().split('?')[0] || 'bin';
  const filename = `payment-proof-${order.orderNumber || order._id}.${extension}`;

  res.status(cloudinaryResponse.status);
  res.setHeader('Content-Type', contentType);
  if (contentLength) {
    res.setHeader('Content-Length', contentLength);
  }
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);

  const body = cloudinaryResponse.body;
  if (!body) {
    return res.end();
  }

  const nodeStream = body.pipe ? body : Readable.fromWeb(body);
  await pipeline(nodeStream, res);
});

// Admin: Get all orders
export const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, sort = '-createdAt' } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const pageNum  = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip     = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Order.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// Admin: Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, adminNotes } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  if (orderStatus) {
    order.orderStatus = orderStatus;
    order.statusHistory.push({ status: orderStatus, note: adminNotes || '' });
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (adminNotes)    order.adminNotes = adminNotes;

  await order.save();

  return ApiResponse.success(res, order, 'Order status updated');
});

// Admin: Add tracking information
export const updateTracking = asyncHandler(async (req, res) => {
  const { number, provider, url } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  order.tracking = { number, provider, url, shippedAt: new Date() };
  if (order.orderStatus !== 'shipped' && order.orderStatus !== 'delivered') {
    order.orderStatus = 'shipped';
    order.statusHistory.push({ status: 'shipped', note: `Tracking: ${number}` });
  }

  await order.save();

  return ApiResponse.success(res, order, 'Tracking information added');
});

// Admin: delete an order and its payment proof (if any)
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  // Remove payment proof from Cloudinary if present
  if (order.paymentProof?.publicId) {
    // lazy import to avoid circular deps
    const { deleteFromCloudinary } = await import('../../middleware/upload.middleware.js');
    try { await deleteFromCloudinary(order.paymentProof.publicId); } catch (err) { /* log and continue */ }
  }

  await Order.findByIdAndDelete(req.params.id);

  return ApiResponse.success(res, null, 'Order deleted');
});
