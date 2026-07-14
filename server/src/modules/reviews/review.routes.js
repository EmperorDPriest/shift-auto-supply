import express from 'express';
import { getReviews, createReview, approveReview, deleteReview } from './review.controller.js';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/',              getReviews);
router.post('/',             optionalAuth, createReview);
router.patch('/:id/approve', authenticate, authorize('admin'), approveReview);
router.delete('/:id',        authenticate, authorize('admin'), deleteReview);

export default router;
