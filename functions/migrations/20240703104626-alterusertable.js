'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'access', {
      type: Sequelize.STRING,
      allowNull: true, // Or false, depending on your requirements
      defaultValue: 'Resume' // Optional default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'access');
  }
};
