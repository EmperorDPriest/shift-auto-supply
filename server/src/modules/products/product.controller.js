import slugify from 'slugify';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import Product from './product.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../middleware/upload.middleware.js';

export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 24, sort = '-createdAt',
    brand, model, year, category, condition,
    minPrice, maxPrice, q, featured, inStock,
  } = req.query;

  const filter = { isActive: true };

  if (q) filter.$text = { $search: q };
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  if (category) filter.category = { $regex: category, $options: 'i' };
  if (condition) filter.condition = condition;
  if (featured === 'true') filter.isFeatured = true;
  if (inStock === 'true') filter.stock = { $gt: 0 };

  if (model) {
    filter['vehicleModels.model'] = { $regex: model, $options: 'i' };
  }

  if (year) {
    const yearNum = parseInt(year);
    filter.$or = [
      { 'vehicleModels.yearFrom': { $lte: yearNum }, 'vehicleModels.yearTo': { $gte: yearNum } },
      { 'vehicleModels.yearFrom': { $exists: false } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  const pageNum  = Math.max(parseInt(page), 1);
  const limitNum = Math.min(parseInt(limit), 100);
  const skip     = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    products,
    pagination: {
      page:  pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');

  // Increment view count (non-blocking)
  Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

  return ApiResponse.success(res, product);
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true, stock: { $gt: 0 } })
    .sort('-createdAt')
    .limit(12)
    .lean();
  return ApiResponse.success(res, products);
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return ApiResponse.success(res, categories);
});

export const searchByVin = asyncHandler(async (req, res) => {
  const { vin } = req.params;
  if (!vin || vin.length !== 17) throw ApiError.badRequest('Invalid VIN — must be 17 characters');

  const products = await Product.find({
    vinCompatibility: { $in: [vin.toUpperCase()] },
    isActive: true,
  }).lean();

  return ApiResponse.success(res, products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = JSON.parse(req.body.data || '{}');
  const { name, sku, brand, price, description, category, condition, stock, vehicleModels } = data;

  if (!name || !sku || !brand || !price || !description || !category)
    throw ApiError.badRequest('Missing required product fields');

  // Generate slug
  const slug = slugify(`${brand}-${name}-${sku}`, { lower: true, strict: true });

  // Upload images to Cloudinary
  const images = [];
  if (req.files?.length) {
    for (const file of req.files.slice(0, 2)) {
      const result = await uploadToCloudinary(file.buffer, 'products');
      images.push(result);
    }
  }

  const product = await Product.create({
    ...data,
    slug,
    images,
    vehicleModels: vehicleModels || [],
  });

  return ApiResponse.created(res, product, 'Product created');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  // Regenerate slug if name changed
  if (req.body.name && req.body.name !== product.name) {
    req.body.slug = slugify(`${req.body.brand || product.brand}-${req.body.name}-${product.sku}`, {
      lower: true, strict: true,
    });
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });

  return ApiResponse.success(res, updated, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  // Delete images from Cloudinary
  for (const img of product.images) {
    await deleteFromCloudinary(img.publicId);
  }

  await product.deleteOne();
  return ApiResponse.success(res, null, 'Product deleted');
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  if (!req.files?.length) throw ApiError.badRequest('No images uploaded');

  // Delete old images
  for (const img of product.images) {
    await deleteFromCloudinary(img.publicId);
  }

  // Upload new images (max 2)
  const images = [];
  for (const file of req.files.slice(0, 2)) {
    const result = await uploadToCloudinary(file.buffer, 'products');
    images.push(result);
  }

  product.images = images;
  await product.save();

  return ApiResponse.success(res, product, 'Images updated');
});
