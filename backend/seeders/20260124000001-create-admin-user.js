'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the password
    const hashedPassword = await bcrypt.hash('GodTrav@24', 12);

    // Create the admin user
    await queryInterface.bulkInsert('Users', [{
      name: 'God Trav',
      email: 'godtrav@cloverguard.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    // Remove the admin user
    await queryInterface.bulkDelete('Users', {
      email: 'godtrav@cloverguard.com'
    });
  }
};