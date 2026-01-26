'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });
      Message.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });
    }
  }

  Message.init({
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Message',
  });

  return Message;
};
