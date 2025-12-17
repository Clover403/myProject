'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Target extends Model {
    static associate(models) {
      Target.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Target.hasMany(models.Scan, {
        foreignKey: 'targetId',
        as: 'scans'
      });
    }
  }
  
  const tagsDataType = sequelize.getDialect() === 'postgres'
    ? DataTypes.ARRAY(DataTypes.STRING)
    : DataTypes.JSON;

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
      type: tagsDataType,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Target',
    timestamps: true,
    underscored: false
  });
  
  return Target;
};