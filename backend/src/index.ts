import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Order from './models/Order.js';
import Settings from './models/Settings.js';
import Customer from './models/Customer.js';

async function processCustomer(customerData: { name?: string, email?: string, phone?: string }) {
  if (!customerData || (!customerData.email && !customerData.phone)) return;
  
  try {
    const query = [];
    if (customerData.email) query.push({ email: customerData.email });
    if (customerData.phone) query.push({ phone: customerData.phone });

    let customer = await Customer.findOne({ $or: query });
    if (customer) {
      customer.ordersCount += 1;
      customer.lastOrderDate = new Date();
      if (customerData.name && !customer.name) customer.name = customerData.name;
      await customer.save();
    } else {
      await Customer.create({
        name: customerData.name || 'Unknown',
        email: customerData.email || '',
        phone: customerData.phone || '',
        ordersCount: 1,
        lastOrderDate: new Date()
      });
    }
  } catch (err) {
    console.error("Error processing customer data:", err);
  }
}

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// Configure Multer for file uploads
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });



// Override the middleware properly for upload
// Actually, let's just make it public and handle auth if needed. It's fine to make public for customers
app.post('/api/upload-public', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, fileUrl });
  } catch (error) {
    console.error("Upload error", error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
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
      const mockOrderId = `order_mock_${Date.now()}`;
      
      const newOrder = new Order({
        razorpayOrderId: mockOrderId,
        amount: amountInPaise,
        printSettings: req.body.printSettings || {},
        customer: req.body.customer || {},
        fileUrl: req.body.fileUrl || ''
      });
      await newOrder.save();
      
      return res.status(200).json({
        success: true,
        order: {
          id: mockOrderId,
          amount: amountInPaise,
          currency: 'INR'
        }
      });
    }

    const order = await razorpay.orders.create(options);

    // Save to Database
    const newOrder = new Order({
      razorpayOrderId: order.id,
      amount: amountInPaise,
      printSettings: req.body.printSettings || {},
      customer: req.body.customer || {},
      fileUrl: req.body.fileUrl || ''
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
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          status: 'Confirmed', 
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date()
        },
        { new: true }
      );
      if (order && order.customer) {
        await processCustomer(order.customer);
      }
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

// Admin Authentication Endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';

  if (password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '1d' });
    res.status(200).json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Authentication Middleware
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';

  try {
    jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired token' });
  }
};

// Get Settings (Public so frontend can read prices)
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

// Update Settings (Protected)
app.post('/api/settings', authenticateAdmin, async (req, res) => {
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
app.get('/api/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Delete an order
app.delete('/api/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
});

// Update order status (for Admin Panel)
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const oldOrder = await Order.findById(req.params.id);
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status, updatedAt: new Date() }, 
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // If it's being confirmed/processed for the first time
    if (oldOrder && oldOrder.status === 'Payment Pending' && status !== 'Payment Pending' && order.customer) {
      await processCustomer(order.customer);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Get all customers (for Admin Panel)
app.get('/api/customers', authenticateAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ lastOrderDate: -1 });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
