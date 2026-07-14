import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, REFRESH_COOKIE_OPTIONS } from '../../utils/tokens.js';
import User from '../users/user.model.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password)
    throw ApiError.badRequest('Name, email and password are required');

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, phone, password });

  const accessToken  = generateAccessToken({ id: user._id, role: user.role });
  const refreshTokenValue = generateRefreshToken({ id: user._id });

  user.refreshToken = refreshTokenValue;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshTokenValue, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.created(res, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  }, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw ApiError.unauthorized('Invalid credentials');

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshTokenValue = generateRefreshToken({ id: user._id });

  user.refreshToken = refreshTokenValue;
  user.lastLoginAt  = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshTokenValue, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  }, 'Login successful');
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { $unset: { refreshToken: 1 } });
  }

  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
  return ApiResponse.success(res, null, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token');

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token || !user.isActive)
    throw ApiError.unauthorized('Invalid refresh token');

  const newAccessToken  = generateAccessToken({ id: user._id, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user._id });

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return ApiResponse.success(res, { accessToken: newAccessToken }, 'Token refreshed');
});

export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user);
});
