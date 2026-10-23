import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CanteenItem, CampusOrder } from '../models/CampusOrder.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/PracticeSet.js';
import { getIO } from '../sockets/index.js';

const router = express.Router();

// -------------------------------------------------------------
// 1. Menu Catalogue Endpoints
// -------------------------------------------------------------

router.get('/items', async (req, res, next) => {
  try {
    const { category, search, availableOnly } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (availableOnly === 'true') filter.isAvailable = true;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let items = await CanteenItem.find(filter).sort({ category: 1, name: 1 });

    // Seed default nutritious institutional menu if empty
    if (items.length === 0 && !search && !category) {
      const defaultItems = [
        {
          code: 'CAN-101',
          name: 'Amritsari Kulcha with Chana & Pickle',
          category: 'Breakfast',
          price: 55,
          description: 'Crispy clay oven-baked potato stuffed kulcha served with spiced chickpeas.',
          preparationTimeMinutes: 8,
          isVegetarian: true,
          stockQuantity: 40,
        },
        {
          code: 'CAN-102',
          name: 'Masala Dosa with Sambar & Chutneys',
          category: 'Breakfast',
          price: 60,
          description: 'Crispy rice crepe filled with seasoned potato mash, accompanied by lentil stew.',
          preparationTimeMinutes: 10,
          isVegetarian: true,
          stockQuantity: 35,
        },
        {
          code: 'CAN-103',
          name: 'Special North Indian Student Thali',
          category: 'Meals & Thali',
          price: 90,
          description: 'Dal Makhani, Paneer Butter Masala, Seasonal Sabzi, Steamed Rice, 3 Butter Rotis, Gulab Jamun.',
          preparationTimeMinutes: 12,
          isVegetarian: true,
          stockQuantity: 60,
        },
        {
          code: 'CAN-104',
          name: 'Rajma Chawal Bowl',
          category: 'Meals & Thali',
          price: 65,
          description: 'Slow-simmered Kashmiri red kidney beans over fragrant basmati rice with onions and pickle.',
          preparationTimeMinutes: 5,
          isVegetarian: true,
          stockQuantity: 50,
        },
        {
          code: 'CAN-105',
          name: 'Paneer Kathi Roll',
          category: 'Snacks',
          price: 50,
          description: 'Spiced cottage cheese chunks sautéed with bell peppers and rolled in flaky paratha.',
          preparationTimeMinutes: 7,
          isVegetarian: true,
          stockQuantity: 45,
        },
        {
          code: 'CAN-106',
          name: 'Vegetable Grilled Sandwich',
          category: 'Snacks',
          price: 45,
          description: 'Multi-grain bread toasted with spiced potatoes, cucumber, tomatoes, and mint chutney.',
          preparationTimeMinutes: 6,
          isVegetarian: true,
          stockQuantity: 30,
        },
        {
          code: 'CAN-107',
          name: 'Masala Chai (Ginger & Cardamom)',
          category: 'Beverages',
          price: 15,
          description: 'Freshly brewed aromatic Indian milk tea infused with fresh ginger and green cardamom.',
          preparationTimeMinutes: 3,
          isVegetarian: true,
          stockQuantity: 100,
        },
        {
          code: 'CAN-108',
          name: 'Fresh Sweet Lassi',
          category: 'Beverages',
          price: 30,
          description: 'Chilled Punjabi churned sweet yogurt drink topped with a layer of cream.',
          preparationTimeMinutes: 3,
          isVegetarian: true,
          stockQuantity: 40,
        },
      ];
      await CanteenItem.insertMany(defaultItems);
      items = await CanteenItem.find(filter).sort({ category: 1, name: 1 });
    }

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 2. Student Ordering Workflow
// -------------------------------------------------------------

const placeOrderSchema = {
  body: z.object({
    items: z.array(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().min(1).max(10),
      })
    ).min(1, 'Cart cannot be empty'),
    paymentMethod: z.enum(['PAY_AT_COUNTER', 'CAMPUS_WALLET']).optional(),
    deliveryLocation: z.string().optional(),
    notes: z.string().optional(),
  }),
};

router.post('/order', authenticateToken, requireRole(['student']), validate(placeOrderSchema), async (req, res, next) => {
  try {
    const student = req.user;
    const { items: cartItems, paymentMethod = 'PAY_AT_COUNTER', deliveryLocation = 'Main Canteen Counter', notes = '' } = req.body;

    // Fetch actual menu items from database to recalculate prices on server
    const itemIds = cartItems.map((c) => c.itemId);
    const dbItems = await CanteenItem.find({ _id: { $in: itemIds }, isAvailable: true });

    if (dbItems.length !== cartItems.length) {
      return res.status(400).json({ success: false, message: 'One or more selected items are unavailable or do not exist.' });
    }

    let calculatedTotal = 0;
    const evaluatedOrderItems = [];

    for (const cartItem of cartItems) {
      const dbItem = dbItems.find((d) => d._id.toString() === cartItem.itemId);
      if (!dbItem) continue;

      if (dbItem.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${dbItem.name}'. Only ${dbItem.stockQuantity} remaining.`,
        });
      }

      const subtotal = dbItem.price * cartItem.quantity;
      calculatedTotal += subtotal;

      evaluatedOrderItems.push({
        item: dbItem._id,
        code: dbItem.code,
        name: dbItem.name,
        price: dbItem.price,
        quantity: cartItem.quantity,
        subtotal,
      });

      // Atomically deduct stock
      dbItem.stockQuantity -= cartItem.quantity;
      if (dbItem.stockQuantity <= 0) dbItem.isAvailable = false;
      await dbItem.save();
    }

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const order = new CampusOrder({
      orderNumber,
      student: student._id,
      studentIdNumber: student.idNumber,
      studentName: student.name,
      items: evaluatedOrderItems,
      totalAmount: calculatedTotal,
      status: 'PENDING',
      pickupOtp,
      paymentMethod,
      paymentStatus: paymentMethod === 'CAMPUS_WALLET' ? 'PAID' : 'PENDING',
      deliveryLocation,
      notes,
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          updatedBy: student._id,
          note: `Order placed by ${student.name}. Payment method: ${paymentMethod}.`,
        },
      ],
    });

    await order.save();

    // Notify student in-app
    await Notification.create({
      recipient: student._id,
      title: `Order Placed: ${order.orderNumber}`,
      message: `Your campus canteen order of ₹${order.totalAmount} has been received. Your Pickup OTP is ${order.pickupOtp}.`,
      type: 'CAMPUS',
      actionUrl: '/canteen',
    });

    // Broadcast to vendor staff via Socket.IO if active
    const io = getIO();
    if (io) {
      io.to('role:admin').to('role:faculty').emit('canteen:new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        studentName: order.studentName,
        totalAmount: order.totalAmount,
        itemsCount: order.items.length,
      });
    }

    res.status(201).json({
      success: true,
      message: `Order ${orderNumber} placed successfully. Show Pickup OTP ${pickupOtp} at counter.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

// Student's order history
router.get('/orders/my', authenticateToken, requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const orders = await CampusOrder.find({ student: studentId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

// Student cancels order (only permitted when PENDING)
router.delete('/orders/:id/cancel', authenticateToken, requireRole(['student']), async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const order = await CampusOrder.findOne({ _id: req.params.id, student: studentId });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already '${order.status}'.`,
      });
    }

    order.status = 'CANCELLED';
    order.cancellationReason = 'Cancelled by student prior to kitchen preparation.';
    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      updatedBy: studentId,
      note: 'Order cancelled by customer.',
    });

    // Restock items
    for (const item of order.items) {
      await CanteenItem.findByIdAndUpdate(item.item, {
        $inc: { stockQuantity: item.quantity },
        $set: { isAvailable: true },
      });
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} cancelled successfully.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 3. Staff / Vendor Order Management
// -------------------------------------------------------------

router.get('/orders', authenticateToken, requireRole(['admin', 'faculty']), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await CampusOrder.find(filter)
      .populate('student', 'name idNumber phone email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

// Staff updates order status
const updateOrderStatusSchema = {
  body: z.object({
    status: z.enum(['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']),
    note: z.string().optional(),
    cancellationReason: z.string().optional(),
  }),
};

router.put('/orders/:id/status', authenticateToken, requireRole(['admin', 'faculty']), validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const { status, note = '', cancellationReason = '' } = req.body;
    const staff = req.user;

    const order = await CampusOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (cancellationReason) order.cancellationReason = cancellationReason;
    if (status === 'COMPLETED') order.paymentStatus = 'PAID';

    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: staff._id,
      note: note || `Status updated to ${status} by staff ${staff.name}.`,
    });

    await order.save();

    // In-App Notification to student
    let notifMsg = `Your canteen order ${order.orderNumber} is now ${status.replace('_', ' ')}.`;
    if (status === 'READY_FOR_PICKUP') {
      notifMsg = `🔔 YOUR ORDER IS READY! Order ${order.orderNumber} is ready for pickup at Counter 1. OTP: ${order.pickupOtp}.`;
    }

    await Notification.create({
      recipient: order.student,
      title: `Order Update: ${status.replace('_', ' ')}`,
      message: notifMsg,
      type: 'CAMPUS',
      actionUrl: '/canteen',
    });

    // Real-Time Socket.IO update to student private room
    const io = getIO();
    if (io) {
      io.to(`user:${order.student.toString()}`).emit('canteen:order_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        message: notifMsg,
      });
    }

    res.json({
      success: true,
      message: `Order ${order.orderNumber} updated to ${status}.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

// Staff adds / edits menu catalogue items
router.post('/items', authenticateToken, requireRole(['admin', 'faculty']), async (req, res, next) => {
  try {
    const { code, name, category, price, description = '', stockQuantity = 50, preparationTimeMinutes = 10 } = req.body;

    const existing = await CanteenItem.findOne({ code });
    if (existing) return res.status(409).json({ success: false, message: 'Item code already exists' });

    const item = new CanteenItem({
      code,
      name,
      category,
      price,
      description,
      stockQuantity,
      preparationTimeMinutes,
    });

    await item.save();
    res.status(201).json({ success: true, message: 'Menu item created successfully', data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
