'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update the status enum to include new statuses
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Orders_status" ADD VALUE IF NOT EXISTS 'waiting_payment';
    `).catch(() => {
      // Ignore if already exists
    });

    // Add payment-related columns
    await queryInterface.addColumn('Orders', 'paymentStatus', {
      type: Sequelize.ENUM('unpaid', 'pending', 'paid', 'expired', 'failed'),
      defaultValue: 'unpaid',
      allowNull: false
    });

    await queryInterface.addColumn('Orders', 'midtransOrderId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('Orders', 'midtransToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'midtransRedirectUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'paidAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'paymentMethod', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add submission-related columns
    await queryInterface.addColumn('Orders', 'submittedFileUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'submittedFileName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'submittedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'submitNotes', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'revisionCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Orders', 'buyerReview', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'buyerRating', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'paymentStatus');
    await queryInterface.removeColumn('Orders', 'midtransOrderId');
    await queryInterface.removeColumn('Orders', 'midtransToken');
    await queryInterface.removeColumn('Orders', 'midtransRedirectUrl');
    await queryInterface.removeColumn('Orders', 'paidAt');
    await queryInterface.removeColumn('Orders', 'paymentMethod');
    await queryInterface.removeColumn('Orders', 'submittedFileUrl');
    await queryInterface.removeColumn('Orders', 'submittedFileName');
    await queryInterface.removeColumn('Orders', 'submittedAt');
    await queryInterface.removeColumn('Orders', 'submitNotes');
    await queryInterface.removeColumn('Orders', 'revisionCount');
    await queryInterface.removeColumn('Orders', 'buyerReview');
    await queryInterface.removeColumn('Orders', 'buyerRating');
    
    // Drop the enum
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_paymentStatus";');
  }
};
