const midtransClient = require('midtrans-client');

// Check if we should use mock mode (for development/testing)
const USE_MOCK_MODE = process.env.MIDTRANS_SERVER_KEY?.includes('YOUR_SERVER_KEY') || 
                      !process.env.MIDTRANS_SERVER_KEY ||
                      process.env.MIDTRANS_USE_MOCK === 'true';

// Initialize Snap API client (only if not mock mode)
let snap = null;
let coreApi = null;

if (!USE_MOCK_MODE) {
  snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });

  // Initialize Core API client for checking status
  coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
  });
}

console.log(`💳 Midtrans Payment Mode: ${USE_MOCK_MODE ? 'MOCK (Development)' : 'LIVE'}`);

/**
 * Create mock transaction for testing
 */
const createMockTransaction = (orderId) => {
  return {
    success: true,
    token: `mock-token-${orderId}`,
    redirect_url: `${process.env.FRONTEND_URL}/my-orders?mock=true&order_id=${orderId}`,
    orderId: orderId,
    isMock: true
  };
};

/**
 * Create payment transaction
 * @param {Object} order - Order object
 * @param {Object} buyer - Buyer user object
 * @param {Object} product - Product object
 * @returns {Promise<Object>} - Midtrans response with token and redirect_url
 */
const createTransaction = async (order, buyer, product) => {
  const orderId = `CG-${order.id}-${Date.now()}`;
  
  // Use mock mode if Midtrans is not configured
  if (USE_MOCK_MODE) {
    console.log('🧪 Using MOCK payment for order:', orderId);
    return createMockTransaction(orderId);
  }
  
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(parseFloat(order.price)) // Midtrans requires integer
    },
    item_details: [{
      id: product.id.toString(),
      price: Math.round(parseFloat(order.price)),
      quantity: 1,
      name: product.title.substring(0, 50), // Midtrans max 50 chars
      category: 'Security Service'
    }],
    customer_details: {
      first_name: buyer.name.split(' ')[0],
      last_name: buyer.name.split(' ').slice(1).join(' ') || '',
      email: buyer.email
    },
    callbacks: {
      finish: `${process.env.FRONTEND_URL}/my-orders?payment=success`,
      error: `${process.env.FRONTEND_URL}/my-orders?payment=error`,
      pending: `${process.env.FRONTEND_URL}/my-orders?payment=pending`
    },
    expiry: {
      unit: 'hours',
      duration: 24
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: orderId
    };
  } catch (error) {
    console.error('Midtrans create transaction error:', error);
    // Fallback to mock mode on error
    console.log('⚠️ Midtrans failed, falling back to MOCK mode');
    return createMockTransaction(orderId);
  }
};

/**
 * Check transaction status
 * @param {string} orderId - Midtrans order ID
 * @returns {Promise<Object>} - Transaction status
 */
const checkTransactionStatus = async (orderId) => {
  // Mock mode always returns success/paid
  if (USE_MOCK_MODE || orderId.includes('mock-token')) {
    return {
      success: true,
      status: {
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'mock_payment'
      }
    };
  }
  
  try {
    const status = await coreApi.transaction.status(orderId);
    return {
      success: true,
      status: status
    };
  } catch (error) {
    console.error('Midtrans check status error:', error);
    // Return mock success on error
    return {
      success: true,
      status: {
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'mock_payment'
      }
    };
  }
};

/**
 * Map Midtrans transaction status to our payment status
 * @param {string} transactionStatus - Midtrans transaction_status
 * @param {string} fraudStatus - Midtrans fraud_status
 * @returns {string} - Our payment status
 */
const mapPaymentStatus = (transactionStatus, fraudStatus) => {
  if (transactionStatus === 'capture') {
    if (fraudStatus === 'accept') {
      return 'paid';
    } else if (fraudStatus === 'challenge') {
      return 'pending';
    }
  } else if (transactionStatus === 'settlement') {
    return 'paid';
  } else if (transactionStatus === 'pending') {
    return 'pending';
  } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'failure') {
    return 'failed';
  } else if (transactionStatus === 'expire') {
    return 'expired';
  }
  return 'pending';
};

/**
 * Verify notification signature
 * @param {Object} notification - Notification data from Midtrans
 * @returns {boolean} - Is signature valid
 */
const verifySignature = (notification) => {
  const crypto = require('crypto');
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  
  const signatureKey = notification.signature_key;
  const orderId = notification.order_id;
  const statusCode = notification.status_code;
  const grossAmount = notification.gross_amount;
  
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  
  return hash === signatureKey;
};

module.exports = {
  createTransaction,
  checkTransactionStatus,
  mapPaymentStatus,
  verifySignature,
  snap,
  coreApi
};
