'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AIExplanations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vulnerabilityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Vulnerabilities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      fixRecommendation: {
        type: Sequelize.TEXT
      },
      additionalResources: {
        type: Sequelize.JSON
      },
      aiModel: {
        type: Sequelize.STRING(100)
      },
      tokensUsed: {
        type: Sequelize.INTEGER
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AIExplanations');
  }
};