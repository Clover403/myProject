'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Scan, {
        foreignKey: 'userId',
        as: 'scans'
      });
      User.hasMany(models.Target, {
        foreignKey: 'userId',
        as: 'targets'
      });
      User.hasMany(models.Product, {
        foreignKey: 'ethackId',
        as: 'products'
      });
      // Order associations
      User.hasMany(models.Order, {
        foreignKey: 'buyerId',
        as: 'purchases'
      });
      User.hasMany(models.Order, {
        foreignKey: 'sellerId',
        as: 'sales'
      });
      // Conversation associations
      User.hasMany(models.Conversation, {
        foreignKey: 'participant1Id',
        as: 'conversationsAsParticipant1'
      });
      User.hasMany(models.Conversation, {
        foreignKey: 'participant2Id',
        as: 'conversationsAsParticipant2'
      });
      // Message associations
      User.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
    }
  }
  
  User.init({
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    picture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    locale: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('user', 'ethack', 'admin'),
      defaultValue: 'user',
      allowNull: false
    },
    isOnJob: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    currentOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    underscored: false
  });
  
  return User;
};
