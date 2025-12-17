'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Scans', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Scans', 'userId');
  }
};
