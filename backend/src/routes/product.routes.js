const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireEthackOrAdmin, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/ethack/:ethackId', productController.getProductsByEthack);

// Protected routes - Ethack or Admin
router.get('/my/products', requireAuth, requireEthackOrAdmin, productController.getMyProducts);
router.post('/', requireAuth, requireEthackOrAdmin, productController.createProduct);
router.put('/:id', requireAuth, requireEthackOrAdmin, productController.updateProduct);
router.delete('/:id', requireAuth, requireEthackOrAdmin, productController.deleteProduct);

// Admin only routes
router.get('/admin/all', requireAuth, requireAdmin, productController.adminGetAllProducts);

module.exports = router;
