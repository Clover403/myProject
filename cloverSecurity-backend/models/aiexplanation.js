'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AIExplanation extends Model {
    static associate(models) {
      AIExplanation.belongsTo(models.Vulnerability, {
        foreignKey: 'vulnerabilityId',
        as: 'vulnerability'
      });
    }
  }
  
  AIExplanation.init({
    vulnerabilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fixRecommendation: DataTypes.TEXT,
    additionalResources: DataTypes.JSON,
    aiModel: DataTypes.STRING(100),
    tokensUsed: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AIExplanation',
  });
  
  return AIExplanation;
};