const { Product, User } = require('../../models');
const { Op } = require('sequelize');

// Get all products (public)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      isActive: true
    };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'ethack',
        attributes: ['id', 'name', 'email', 'picture']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get product by ID (public)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'ethack',
        attributes: ['id', 'name', 'email', 'picture']
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Get products by ethack (public)
exports.getProductsByEthack = async (req, res) => {
  try {
    const { ethackId } = req.params;
    
    const products = await Product.findAll({
      where: { 
        ethackId,
        isActive: true 
      },
      include: [{
        model: User,
        as: 'ethack',
        attributes: ['id', 'name', 'email', 'picture']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, products });
  } catch (error) {
    console.error('Get products by ethack error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get my products (ethack only)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { ethackId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, products });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Create product (ethack only)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, imageProduct } = req.body;

    // Validate required fields
    if (!title || !description || price === undefined) {
      return res.status(400).json({ error: 'Title, description and price are required' });
    }

    // Only ethack can create products
    if (req.user.role !== 'ethack' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only ethical hackers can create products' });
    }

    const product = await Product.create({
      title,
      description,
      price: parseFloat(price),
      imageProduct,
      ethackId: req.user.id
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product (ethack owner or admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, imageProduct, isActive } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership: ethack can only update their own products, admin can update any
    if (req.user.role !== 'admin' && product.ethackId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own products' });
    }

    await product.update({
      title: title || product.title,
      description: description || product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      imageProduct: imageProduct !== undefined ? imageProduct : product.imageProduct,
      isActive: isActive !== undefined ? isActive : product.isActive
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (ethack owner or admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check ownership: ethack can only delete their own products, admin can delete any
    if (req.user.role !== 'admin' && product.ethackId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own products' });
    }

    await product.destroy();

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Admin: Get all products (including inactive)
exports.adminGetAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'ethack',
        attributes: ['id', 'name', 'email', 'picture']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      products,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Admin get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};
