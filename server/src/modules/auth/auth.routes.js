import express from 'express';
import { register, login, logout, refreshToken, getMe } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login',    authRateLimiter, login);
router.post('/logout',   logout);
router.post('/refresh',  refreshToken);
router.get('/me',        authenticate, getMe);

export default router;
