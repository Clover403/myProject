const { Order, Product, User } = require('../../models');
const { Op } = require('sequelize');
const midtransService = require('../services/midtransService');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { productId, notes } = req.body;
    const buyerId = req.user.id;

    // Get product and verify it exists
    const product = await Product.findByPk(productId, {
      include: [{ model: User, as: 'ethack' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.isActive) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Can't order your own product
    if (product.ethackId === buyerId) {
      return res.status(400).json({ error: 'You cannot order your own product' });
    }

    // Check if buyer already has a pending/active order for this product
    const existingOrder = await Order.findOne({
      where: {
        productId,
        buyerId,
        status: { [Op.notIn]: ['completed', 'rejected'] }
      }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'You already have an active order for this product' });
    }

    // Create the order
    const order = await Order.create({
      productId,
      buyerId,
      sellerId: product.ethackId,
      price: product.price,
      notes,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Fetch the complete order with associations
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture'] }
      ]
    });

    res.status(201).json({ success: true, order: completeOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get orders for buyer (my purchases)
const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { buyerId };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get orders for seller (incoming orders)
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('📦 [getSellerOrders] sellerId:', sellerId, 'status:', status);

    const where = { sellerId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    console.log('📦 [getSellerOrders] Found orders:', count);

    // Get seller's current job status
    const seller = await User.findByPk(sellerId, {
      attributes: ['isOnJob', 'currentOrderId']
    });

    res.json({
      success: true,
      orders,
      sellerStatus: {
        isOnJob: seller?.isOnJob || false,
        currentOrderId: seller?.currentOrderId || null
      },
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only buyer or seller can view the order
    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Accept order (seller only) - Changes status to waiting_payment
const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order cannot be accepted in current status' });
    }

    // Create Midtrans payment
    const buyer = order.buyer;
    const product = order.product;
    
    const paymentResult = await midtransService.createTransaction(order, buyer, product);
    
    if (!paymentResult.success) {
      return res.status(500).json({ error: 'Failed to create payment: ' + paymentResult.error });
    }

    // Update order status to waiting_payment
    order.status = 'waiting_payment';
    order.paymentStatus = 'pending';
    order.midtransOrderId = paymentResult.orderId;
    order.midtransToken = paymentResult.token;
    order.midtransRedirectUrl = paymentResult.redirect_url;
    await order.save();

    // Fetch updated order with associations
    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ]
    });

    res.json({ 
      success: true, 
      order: updatedOrder, 
      payment: {
        token: paymentResult.token,
        redirectUrl: paymentResult.redirect_url
      },
      message: 'Order accepted. Waiting for buyer payment.' 
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
};

// Reject order (seller only)
const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order cannot be rejected in current status' });
    }

    order.status = 'rejected';
    order.rejectionReason = reason;
    await order.save();

    res.json({ success: true, order, message: 'Order rejected' });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ error: 'Failed to reject order' });
  }
};

// Get payment page (buyer initiates payment)
const initiatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'waiting_payment') {
      return res.status(400).json({ error: 'Order is not waiting for payment' });
    }

    // If token exists and not expired, return it
    if (order.midtransToken && order.midtransRedirectUrl) {
      return res.json({
        success: true,
        payment: {
          token: order.midtransToken,
          redirectUrl: order.midtransRedirectUrl
        }
      });
    }

    // Create new payment if not exists
    const buyer = order.buyer;
    const product = order.product;
    
    const paymentResult = await midtransService.createTransaction(order, buyer, product);
    
    if (!paymentResult.success) {
      return res.status(500).json({ error: 'Failed to create payment: ' + paymentResult.error });
    }

    order.midtransOrderId = paymentResult.orderId;
    order.midtransToken = paymentResult.token;
    order.midtransRedirectUrl = paymentResult.redirect_url;
    await order.save();

    res.json({
      success: true,
      payment: {
        token: paymentResult.token,
        redirectUrl: paymentResult.redirect_url
      }
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

// Handle Midtrans webhook notification
const handlePaymentNotification = async (req, res) => {
  try {
    const notification = req.body;
    
    console.log('📬 Received Midtrans notification:', notification);

    // Verify signature
    if (!midtransService.verifySignature(notification)) {
      console.error('Invalid Midtrans signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const { order_id: midtransOrderId, transaction_status, fraud_status, payment_type } = notification;

    // Find order by midtrans order ID
    const order = await Order.findOne({
      where: { midtransOrderId },
      include: [{ model: User, as: 'seller' }]
    });

    if (!order) {
      console.error('Order not found for midtrans order:', midtransOrderId);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Map payment status
    const paymentStatus = midtransService.mapPaymentStatus(transaction_status, fraud_status);
    
    order.paymentStatus = paymentStatus;
    order.paymentMethod = payment_type;

    if (paymentStatus === 'paid') {
      order.paidAt = new Date();
      order.status = 'on_process';
      
      // Set seller as on job
      const seller = order.seller;
      seller.isOnJob = true;
      seller.currentOrderId = order.id;
      await seller.save();
    } else if (paymentStatus === 'expired' || paymentStatus === 'failed') {
      // Revert to pending so seller can accept again
      order.status = 'pending';
      order.midtransToken = null;
      order.midtransRedirectUrl = null;
      order.midtransOrderId = null;
    }

    await order.save();

    console.log('✅ Payment notification processed:', { orderId: order.id, paymentStatus, orderStatus: order.status });

    res.json({ success: true });
  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(500).json({ error: 'Failed to process notification' });
  }
};

// Submit completed work (seller only) - with file support
const submitOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, fileUrl, fileName } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'on_process' && order.status !== 'revision') {
      return res.status(400).json({ error: 'Order cannot be submitted in current status' });
    }

    order.status = 'submitted';
    order.submitNotes = notes;
    order.submittedAt = new Date();
    
    if (fileUrl) {
      order.submittedFileUrl = fileUrl;
      order.submittedFileName = fileName || 'Deliverable';
    }
    
    await order.save();

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ]
    });

    res.json({ success: true, order: updatedOrder, message: 'Work submitted successfully' });
  } catch (error) {
    console.error('Submit order error:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
};

// Request revision (buyer only)
const requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const buyerId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'submitted') {
      return res.status(400).json({ error: 'Revision can only be requested for submitted orders' });
    }

    order.status = 'revision';
    order.revisionNotes = notes;
    order.revisionCount = (order.revisionCount || 0) + 1;
    await order.save();

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ]
    });

    res.json({ success: true, order: updatedOrder, message: 'Revision requested' });
  } catch (error) {
    console.error('Request revision error:', error);
    res.status(500).json({ error: 'Failed to request revision' });
  }
};

// Complete order (buyer accepts submitted work)
const completeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { review, rating } = req.body;
    const buyerId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [{ model: User, as: 'seller' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'submitted') {
      return res.status(400).json({ error: 'Order can only be completed from submitted status' });
    }

    order.status = 'completed';
    order.completedAt = new Date();
    
    if (review) {
      order.buyerReview = review;
    }
    if (rating) {
      order.buyerRating = rating;
    }
    
    await order.save();

    // Free up the seller
    const seller = order.seller;
    seller.isOnJob = false;
    seller.currentOrderId = null;
    await seller.save();

    const updatedOrder = await Order.findByPk(id, {
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'picture'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'picture', 'isOnJob'] }
      ]
    });

    res.json({ success: true, order: updatedOrder, message: 'Order completed successfully' });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
};

// Cancel order (buyer only, only for pending orders)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'pending' && order.status !== 'waiting_payment') {
      return res.status(400).json({ error: 'Only pending or waiting_payment orders can be cancelled' });
    }

    await order.destroy();

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get order stats for dashboard
const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'ethack' || userRole === 'admin') {
      // Seller stats
      const pendingCount = await Order.count({ where: { sellerId: userId, status: 'pending' } });
      const waitingPaymentCount = await Order.count({ where: { sellerId: userId, status: 'waiting_payment' } });
      const activeCount = await Order.count({ 
        where: { 
          sellerId: userId, 
          status: { [Op.in]: ['on_process', 'submitted', 'revision'] } 
        } 
      });
      const completedCount = await Order.count({ where: { sellerId: userId, status: 'completed' } });

      stats.seller = { 
        pending: pendingCount, 
        waitingPayment: waitingPaymentCount,
        active: activeCount, 
        completed: completedCount 
      };
    }

    // Buyer stats
    const myPendingCount = await Order.count({ where: { buyerId: userId, status: 'pending' } });
    const myWaitingPaymentCount = await Order.count({ where: { buyerId: userId, status: 'waiting_payment' } });
    const myActiveCount = await Order.count({ 
      where: { 
        buyerId: userId, 
        status: { [Op.in]: ['on_process', 'submitted', 'revision'] } 
      } 
    });
    const myCompletedCount = await Order.count({ where: { buyerId: userId, status: 'completed' } });

    stats.buyer = { 
      pending: myPendingCount, 
      waitingPayment: myWaitingPaymentCount,
      active: myActiveCount, 
      completed: myCompletedCount 
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
};

// Check payment status (buyer can check)
const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If there's a midtrans order ID, check the status
    if (order.midtransOrderId) {
      const statusResult = await midtransService.checkTransactionStatus(order.midtransOrderId);
      
      if (statusResult.success) {
        const paymentStatus = midtransService.mapPaymentStatus(
          statusResult.status.transaction_status,
          statusResult.status.fraud_status
        );
        
        // Update local status if different
        if (paymentStatus !== order.paymentStatus) {
          order.paymentStatus = paymentStatus;
          order.paymentMethod = statusResult.status.payment_type;
          
          if (paymentStatus === 'paid' && order.status === 'waiting_payment') {
            order.paidAt = new Date();
            order.status = 'on_process';
            
            // Set seller as on job
            const seller = await User.findByPk(order.sellerId);
            seller.isOnJob = true;
            seller.currentOrderId = order.id;
            await seller.save();
          }
          
          await order.save();
        }
      }
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paidAt: order.paidAt
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

// Simulate payment (for mock/testing mode)
const simulatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'seller', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyerId !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.status !== 'waiting_payment') {
      return res.status(400).json({ error: 'Order is not waiting for payment' });
    }

    // Simulate successful payment
    order.paymentStatus = 'paid';
    order.status = 'on_process';
    order.paidAt = new Date();
    order.paymentMethod = 'mock_payment';
    await order.save();

    console.log('🧪 MOCK Payment simulated for order:', id);

    res.json({
      success: true,
      message: 'Payment simulated successfully',
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  acceptOrder,
  rejectOrder,
  initiatePayment,
  handlePaymentNotification,
  submitOrder,
  requestRevision,
  completeOrder,
  cancelOrder,
  getOrderStats,
  checkPaymentStatus,
  simulatePayment
};
