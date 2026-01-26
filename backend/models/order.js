'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
      Order.belongsTo(models.User, {
        foreignKey: 'buyerId',
        as: 'buyer'
      });
      Order.belongsTo(models.User, {
        foreignKey: 'sellerId',
        as: 'seller'
      });
    }
  }

  Order.init({
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'waiting_payment', 'on_process', 'submitted', 'revision', 'completed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    revisionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Payment fields
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'pending', 'paid', 'expired', 'failed'),
      defaultValue: 'unpaid',
      allowNull: false
    },
    midtransOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    midtransToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    midtransRedirectUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Submission fields
    submittedFileUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submittedFileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    submitNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    revisionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    buyerReview: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyerRating: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Order',
  });

  return Order;
};
