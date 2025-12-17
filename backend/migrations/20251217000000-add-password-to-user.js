'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users');
    if (!tableInfo.password) {
      await queryInterface.addColumn('Users', 'password', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'password');
  }
};
