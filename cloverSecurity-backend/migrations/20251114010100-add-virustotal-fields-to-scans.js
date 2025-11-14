'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Scans', 'virustotalVerdict', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('Scans', 'virustotalStats', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('Scans', 'virustotalMaliciousCount', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Scans', 'virustotalLastAnalysisDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Scans', 'virustotalPermalink', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Scans', 'virustotalPermalink');
    await queryInterface.removeColumn('Scans', 'virustotalLastAnalysisDate');
    await queryInterface.removeColumn('Scans', 'virustotalMaliciousCount');
    await queryInterface.removeColumn('Scans', 'virustotalStats');
    await queryInterface.removeColumn('Scans', 'virustotalVerdict');
  },
};
