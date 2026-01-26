const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Midtrans webhook (no auth required - public)
router.post('/notification/midtrans', orderController.handlePaymentNotification);

// All other routes require authentication
router.use(requireAuth);

// Create order (any authenticated user except ethack ordering own product)
router.post('/', orderController.createOrder);

// Get order stats
router.get('/stats', orderController.getOrderStats);

// Get buyer's orders (my purchases)
router.get('/my-orders', orderController.getBuyerOrders);

// Get seller's orders (incoming orders) - only ethack/admin
router.get('/seller-orders', requireRole(['ethack', 'admin']), orderController.getSellerOrders);

// Get single order
router.get('/:id', orderController.getOrderById);

// Accept order (seller only)
router.post('/:id/accept', requireRole(['ethack', 'admin']), orderController.acceptOrder);

// Reject order (seller only)
router.post('/:id/reject', requireRole(['ethack', 'admin']), orderController.rejectOrder);

// Initiate payment (buyer only)
router.post('/:id/pay', orderController.initiatePayment);

// Check payment status
router.get('/:id/payment-status', orderController.checkPaymentStatus);

// Simulate payment (for testing/mock mode)
router.post('/:id/simulate-payment', orderController.simulatePayment);

// Submit work (seller only)
router.post('/:id/submit', requireRole(['ethack', 'admin']), orderController.submitOrder);

// Request revision (buyer only)
router.post('/:id/revision', orderController.requestRevision);

// Complete order (buyer only)
router.post('/:id/complete', orderController.completeOrder);

// Cancel order (buyer only, pending orders only)
router.delete('/:id', orderController.cancelOrder);

module.exports = router;
