'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'token', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '' // Set a default value if required
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'token');
  }
};
