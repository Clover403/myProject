'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Scans', 'progress', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE "Scans"
      SET "progress" = CASE
        WHEN "status" = 'completed' THEN 100
        WHEN "status" = 'failed' THEN 100
        WHEN "status" = 'scanning' THEN 50
        ELSE 0
      END
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Scans', 'progress');
  },
};
