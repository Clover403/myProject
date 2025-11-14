'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Scan extends Model {
    static associate(models) {
      Scan.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
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
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
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
    virustotalVerdict: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    virustotalStats: {
      type: DataTypes.JSON,
      allowNull: true
    },
    virustotalMaliciousCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    virustotalLastAnalysisDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    virustotalPermalink: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    notes: DataTypes.TEXT,
    errorMessage: DataTypes.TEXT,
    completedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Scan',
    timestamps: true,
    underscored: false
  });
  
  return Scan;
};