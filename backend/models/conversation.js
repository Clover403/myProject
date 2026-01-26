'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.User, {
        foreignKey: 'participant1Id',
        as: 'participant1'
      });
      Conversation.belongsTo(models.User, {
        foreignKey: 'participant2Id',
        as: 'participant2'
      });
      Conversation.hasMany(models.Message, {
        foreignKey: 'conversationId',
        as: 'messages'
      });
    }
  }

  Conversation.init({
    participant1Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    participant2Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Conversation',
  });

  return Conversation;
};
