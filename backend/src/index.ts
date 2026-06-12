import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from './models/Order.js';
import Settings from './models/Settings.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printeasy';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Mock Razorpay instance if keys are missing
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret',
});

app.get('/', (req, res) => {
  res.send('PrintEasy Backend API is running!');
});

// Endpoint to create an order
app.post('/api/create-order', async (req, res) => {
  console.log("Received create-order request:", req.body);
  try {
    const { amount } = req.body; // Amount in INR

    if (!amount) {
      console.log("Amount is missing");
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const amountInPaise = Math.round(amount * 100); // Razorpay expects amount in paise
    if (amountInPaise < 100) {
      console.log("Amount too small:", amountInPaise);
      return res.status(400).json({ success: false, error: 'Minimum amount must be at least 100 paise' });
    }

    const options = {
      amount: amountInPaise, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    // If using mock keys, bypass actual Razorpay API and return a mock order
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mock_key_id' || !process.env.RAZORPAY_KEY_ID) {
      console.log("Using Mock Razorpay Order Creation");
      return res.status(200).json({
        success: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: options.amount,
          currency: 'INR'
        }
      });
    }

    const order = await razorpay.orders.create(options);

    // Save to Database
    const newOrder = new Order({
      razorpayOrderId: order.id,
      amount: amountInPaise,
      printSettings: req.body.printSettings || {}
    });
    await newOrder.save();

    res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    if (error.statusCode === 401) {
      return res.status(401).json({ success: false, error: 'Authentication Failed with Razorpay' });
    }
    res.status(500).json({ success: false, error: `Failed to create order: ${error.message || JSON.stringify(error)}` });
  }
});

// Endpoint to verify payment
app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Mock verification
  if (process.env.RAZORPAY_KEY_ID === 'rzp_test_mock_key_id' || !process.env.RAZORPAY_KEY_ID) {
    console.log("Mock Payment Verification Successful");
    return res.status(200).json({ success: true, message: 'Mock payment verified successfully' });
  }

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(sign.toString())
    .digest('hex');

  if (razorpay_signature === expectedSign) {
    try {
      // Payment is authentic, update database
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          status: 'Confirmed', 
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date()
        }
      );
      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } catch (err) {
      console.error("Error updating order in DB", err);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  } else {
    // Invalid signature
    res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }
});

// Get Settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Update Settings
app.post('/api/settings', async (req, res) => {
  try {
    const { prices } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ prices });
    } else {
      settings.prices = prices;
    }
    await settings.save();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Get all orders (for Admin Panel)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Update order status (for Admin Panel)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status, updatedAt: new Date() }, 
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
