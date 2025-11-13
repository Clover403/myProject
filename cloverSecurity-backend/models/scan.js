'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    static associate(models) {
      Scan.belongsTo(models.Target, {
        foreignKey: 'targetId',
        as: 'target'
      });
      
      Scan.hasMany(models.Vulnerability, {
        foreignKey: 'scanId',
        as: 'vulnerabilities'
      });
    }
  }
  
  Scan.init({
    targetId: DataTypes.INTEGER,
    url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    scanType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending'
    },
    totalVulnerabilities: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    criticalCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    highCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    mediumCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lowCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    scanDuration: DataTypes.INTEGER,
    scannerUsed: {
      type: DataTypes.STRING(100),
      defaultValue: 'zap'
    },
    notes: DataTypes.TEXT,
    errorMessage: DataTypes.TEXT,
    completedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Scan',
  });
  
  return Scan;
};