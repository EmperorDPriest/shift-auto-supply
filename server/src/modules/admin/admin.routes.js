import express from 'express';
import { getAnalytics, getUsers, updateUser } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users',     getUsers);
router.patch('/users/:id', updateUser);

export default router;
