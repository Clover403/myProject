'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists first
    const tableInfo = await queryInterface.describeTable('Scans');
    if (!tableInfo.progress) {
      await queryInterface.addColumn('Scans', 'progress', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Scans');
    if (tableInfo.progress) {
      await queryInterface.removeColumn('Scans', 'progress');
    }
  }
};
