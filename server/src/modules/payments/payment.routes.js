import express from 'express';
import { getPublicMethods, getMethods, updateMethod, getMethodForOrder } from './payment.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public — returns only active methods, hides account details
router.get('/methods', getPublicMethods);
router.get('/methods/for-order/:orderId', getMethodForOrder);

// Admin — full management
router.get('/methods/admin',   authenticate, authorize('admin'), getMethods);
router.patch('/methods/:id',   authenticate, authorize('admin'), updateMethod);

// Public detail endpoint for a single method (includes account values when active)
router.get('/methods/:id/details', getMethodDetails);

export default router;
