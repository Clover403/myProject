'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add userId column to Targets table
    await queryInterface.addColumn('Targets', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true, // Start as nullable
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove userId column if rollback
    await queryInterface.removeColumn('Targets', 'userId');
  }
};
