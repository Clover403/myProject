const { User, Product } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'picture', 'role', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'picture', 'role', 'isActive', 'lastLogin', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Cannot change own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    // Validate role
    const validRoles = ['user', 'ethack', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user, ethack, or admin' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Create ethack user (admin only)
exports.createEthackUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters with letters, numbers, and special characters' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with ethack role
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'ethack'
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Create ethack user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot delete admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    await user.destroy();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all ethical hackers (public)
exports.getAllEthicalHackers = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: ethicalHackers } = await User.findAndCountAll({
      where: { 
        role: 'ethack',
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'picture', 'createdAt'],
      include: [{
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false,
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform to include product count
    const hackersWithCount = ethicalHackers.map(hacker => ({
      id: hacker.id,
      name: hacker.name,
      email: hacker.email,
      picture: hacker.picture,
      createdAt: hacker.createdAt,
      productCount: hacker.products?.length || 0
    }));

    res.json({
      success: true,
      ethicalHackers: hackersWithCount,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all ethical hackers error:', error);
    res.status(500).json({ error: 'Failed to fetch ethical hackers' });
  }
};

// Get ethical hacker profile (public)
exports.getEthicalHackerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const hacker = await User.findOne({
      where: { 
        id,
        role: 'ethack',
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'picture', 'createdAt'],
      include: [{
        model: Product,
        as: 'products',
        where: { isActive: true },
        required: false
      }]
    });

    if (!hacker) {
      return res.status(404).json({ error: 'Ethical hacker not found' });
    }

    res.json({ success: true, ethicalHacker: hacker });
  } catch (error) {
    console.error('Get ethical hacker profile error:', error);
    res.status(500).json({ error: 'Failed to fetch ethical hacker profile' });
  }
};

// Toggle user active status (admin only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot toggle self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own status' });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot deactivate admin
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot change admin status' });
    }

    await user.update({ isActive: !user.isActive });

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};
