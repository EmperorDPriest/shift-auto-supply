import { env } from '../config/env.js';
import User from '../modules/users/user.model.js';
import PaymentMethod from '../modules/payments/payment.model.js';
import { logger } from '../config/logger.js';

const DEFAULT_PAYMENT_METHODS = [
  {
    name: 'zelle',
    displayName: 'Zelle',
    icon: 'smartphone',
    isActive: false,
    instructions: 'Send payment via Zelle to the number/email provided below. Include your order number in the memo.',
    accountDetails: [{ label: 'Zelle Phone/Email', value: '' }],
    sortOrder: 1,
  },
  {
    name: 'paypal',
    displayName: 'PayPal',
    icon: 'credit-card',
    isActive: false,
    instructions: 'Send payment via PayPal Friends & Family to the email below. Include your order number in the note.',
    accountDetails: [{ label: 'PayPal Email', value: '' }],
    sortOrder: 2,
  },
  {
    name: 'cashapp',
    displayName: 'Cash App',
    icon: 'dollar-sign',
    isActive: false,
    instructions: 'Send payment via Cash App to the $Cashtag below. Include your order number in the note.',
    accountDetails: [{ label: 'Cash App $Cashtag', value: '' }],
    sortOrder: 3,
  },
  {
    name: 'applepay',
    displayName: 'Apple Pay',
    icon: 'smartphone',
    isActive: false,
    instructions: 'Send payment via Apple Pay to the number below.',
    accountDetails: [{ label: 'Apple Pay Phone', value: '' }],
    sortOrder: 4,
  },
  {
    name: 'creditcard',
    displayName: 'Credit Card',
    icon: 'credit-card',
    isActive: false,
    isMaintenanceMode: true,
    maintenanceMessage: 'Credit card processing is currently unavailable. Please use Zelle, PayPal, or Cash App.',
    accountDetails: [],
    sortOrder: 5,
  },
];

export const seedAdmin = async () => {
  try {
    // Create admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name:     'Admin',
        email:    env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role:     'admin',
      });
      logger.info(`Admin account created: ${env.ADMIN_EMAIL}`);
    }

    // Create payment methods if not exists
    const methodCount = await PaymentMethod.countDocuments();
    if (methodCount === 0) {
      await PaymentMethod.insertMany(DEFAULT_PAYMENT_METHODS);
      logger.info('Default payment methods seeded');
    }

  } catch (err) {
    logger.error('Seed error:', err.message);
  }
};
