'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Scans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      targetId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Targets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      scanType: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending'
      },
      totalVulnerabilities: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      criticalCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      highCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      mediumCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lowCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      scanDuration: {
        type: Sequelize.INTEGER
      },
      scannerUsed: {
        type: Sequelize.STRING(100),
        defaultValue: 'zap'
      },
      notes: {
        type: Sequelize.TEXT
      },
      errorMessage: {
        type: Sequelize.TEXT
      },
      completedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // Add indexes
    await queryInterface.addIndex('Scans', ['targetId']);
    await queryInterface.addIndex('Scans', ['status']);
    await queryInterface.addIndex('Scans', ['createdAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Scans');
  }
};