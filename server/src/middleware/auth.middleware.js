import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../modules/users/user.model.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) throw ApiError.unauthorized('No token provided');

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id).select('-password -refreshToken');

  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw ApiError.forbidden('Insufficient permissions');
  }
  next();
};

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user?.isActive) req.user = user;
    } catch {
      // Optional auth — ignore token errors
    }
  }
  next();
});
