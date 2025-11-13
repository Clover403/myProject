'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Target extends Model {
    static associate(models) {
      Target.hasMany(models.Scan, {
        foreignKey: 'targetId',
        as: 'scans'
      });
    }
  }
  
  Target.init({
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Target',
  });
  
  return Target;
};