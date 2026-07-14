import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError')
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest('Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError')  error = ApiError.unauthorized('Token expired');

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE')
    error = ApiError.badRequest('File too large. Max size is 10MB');

  const statusCode = error.statusCode || 500;
  const message    = error.message || 'Internal server error';

  logger.error({
    statusCode,
    message,
    method: req.method,
    url:    req.originalUrl,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    message,
    errors:  error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
