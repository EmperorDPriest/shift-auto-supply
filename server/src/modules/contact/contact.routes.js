import express from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { sendContactFormToOwner } from '../../utils/email.js';

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, orderNumber, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }

  await sendContactFormToOwner({ name, email, subject: subject || 'General Question', orderNumber, message });

  return ApiResponse.success(res, null, 'Message sent successfully');
}));

export default router;
