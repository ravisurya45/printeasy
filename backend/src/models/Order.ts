import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Payment Pending', 'Confirmed', 'Printing', 'Ready', 'Completed'],
    default: 'Payment Pending' 
  },
  printSettings: {
    pageCount: Number,
    copies: Number,
    printType: String,
    paperSize: String,
    binding: String
  },
  customer: {
    name: String,
    email: String,
    phone: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', OrderSchema);
