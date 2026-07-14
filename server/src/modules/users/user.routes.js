import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import User from './user.model.js';

const router = express.Router();

// Update own profile
router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(phone && { phone }) },
    { new: true, runValidators: true }
  );
  return ApiResponse.success(res, user, 'Profile updated');
}));

// Add/update address
router.post('/me/addresses', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (req.body.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }
  user.addresses.push(req.body);
  await user.save();

  return ApiResponse.success(res, user.addresses, 'Address added');
}));

// Delete address
router.delete('/me/addresses/:addressId', authenticate, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { addresses: { _id: req.params.addressId } }
  });
  return ApiResponse.success(res, null, 'Address removed');
}));

// Deactivate own account
router.delete('/me', authenticate, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false, refreshToken: null });
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, null, 'Account deactivated');
}));

export default router;
