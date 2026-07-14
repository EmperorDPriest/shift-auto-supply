import express from 'express';
import {
  createOrder, getMyOrders, getOrder, trackOrder,
  uploadPaymentProof, downloadPaymentProof, getOrders, updateOrderStatus, updateTracking, deleteOrder,
} from './order.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.middleware.js';
import { proofUpload } from '../../middleware/upload.middleware.js';
import { uploadRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Public / guest routes
router.post('/',              optionalAuth, createOrder);
router.get('/track/:orderNumber', trackOrder);
router.get('/:id/proof',         authenticate, authorize('admin'), downloadPaymentProof);
router.get('/:id',               optionalAuth, getOrder);

// Customer routes (authenticated)
router.get('/my/orders',         authenticate, getMyOrders);
router.post('/:id/proof',        uploadRateLimiter, optionalAuth, proofUpload.single('proof'), uploadPaymentProof);

// Admin routes
router.get('/',              authenticate, authorize('admin'), getOrders);
router.patch('/:id/status',  authenticate, authorize('admin'), updateOrderStatus);
router.patch('/:id/tracking',authenticate, authorize('admin'), updateTracking);
router.delete('/:id',        authenticate, authorize('admin'), deleteOrder);

export default router;
