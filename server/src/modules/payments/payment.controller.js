import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import PaymentMethod from './payment.model.js';

export const getPublicMethods = asyncHandler(async (req, res) => {
  // Returns all methods, but hides sensitive account details
  const methods = await PaymentMethod.find()
    .sort('sortOrder')
    .select('-accountDetails.value')
    .lean();

  return ApiResponse.success(res, methods);
});

// Admin: full details including account values
export const getMethods = asyncHandler(async (req, res) => {
  // Include sensitive account values for admin view (accountDetails.value is select:false by default)
  const methods = await PaymentMethod.find().sort('sortOrder').select('+accountDetails.value').lean();
  return ApiResponse.success(res, methods);
});

// Public: return full details (including account values) for a single method when requested
export const getMethodDetails = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id).select('+accountDetails.value').lean();
  if (!method) throw ApiError.notFound('Payment method not found');
  if (!method.isActive) throw ApiError.forbidden('Payment method is not available');
  return ApiResponse.success(res, method);
});

// Admin: update method settings + account details
export const updateMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findById(req.params.id);
  if (!method) throw ApiError.notFound('Payment method not found');

  const { isActive, isMaintenanceMode, maintenanceMessage, accountDetails, instructions, sortOrder } = req.body;

  if (isActive         !== undefined) method.isActive          = isActive;
  if (isMaintenanceMode !== undefined) method.isMaintenanceMode = isMaintenanceMode;
  if (maintenanceMessage)              method.maintenanceMessage = maintenanceMessage;
  if (accountDetails)                  method.accountDetails    = accountDetails;
  if (instructions)                    method.instructions      = instructions;
  if (sortOrder        !== undefined)  method.sortOrder         = sortOrder;

  await method.save();
  return ApiResponse.success(res, method, 'Payment method updated');
});

// Public: Get full payment method details for a placed order
export const getMethodForOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const Order = (await import('../orders/order.model.js')).default;
  const order = await Order.findById(orderId).select('paymentMethod _id').lean();
  if (!order) throw ApiError.notFound('Order not found');

  const method = await PaymentMethod.findOne({ name: order.paymentMethod }).lean();
  if (!method) throw ApiError.notFound('Payment method not found');

  return ApiResponse.success(res, method);
});
