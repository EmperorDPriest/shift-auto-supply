import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  name: { 
    type: String, 
    enum: ['zelle', 'paypal', 'cashapp', 'applepay', 'creditcard'],
    required: true, 
    unique: true,
  },
  displayName: { type: String, required: true },
  icon:        { type: String }, // icon name from Lucide or similar
  isActive:    { type: Boolean, default: false },
  isMaintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { 
    type: String, 
    default: 'This payment method is currently under maintenance. Please check back soon.' 
  },
  accountDetails: [{
    label: { type: String }, // e.g., "Zelle Phone Number", "PayPal Email"
    value: { type: String, select: false }, // Hidden from public API by default
  }],
  instructions: { type: String }, // Payment instructions shown to customer
  sortOrder:    { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
