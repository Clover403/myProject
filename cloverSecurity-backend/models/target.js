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
        // Custom URL validation - accept http://, https://, and URLs with/without trailing slash
        customValidator(value) {
          const urlRegex = /^https?:\/\/.+/i;
          if (!urlRegex.test(value)) {
            throw new Error('URL must start with http:// or https://');
          }
        }
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