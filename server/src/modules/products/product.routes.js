import express from 'express';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadProductImages, searchByVin, getFeaturedProducts, getCategories,
} from './product.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { productUpload } from '../../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/',              getProducts);
router.get('/featured',      getFeaturedProducts);
router.get('/categories',    getCategories);
router.get('/vin/:vin',      searchByVin);
router.get('/:slug',         getProduct);

// Admin routes
router.post('/',             authenticate, authorize('admin'), productUpload.array('images', 2), createProduct);
router.patch('/:id',         authenticate, authorize('admin'), updateProduct);
router.delete('/:id',        authenticate, authorize('admin'), deleteProduct);
router.post('/:id/images',   authenticate, authorize('admin'), productUpload.array('images', 2), uploadProductImages);

export default router;
