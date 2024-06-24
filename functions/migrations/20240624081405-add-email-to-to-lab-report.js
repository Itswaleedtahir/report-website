'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('lab_report', 'email_to', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '' // Set a default value if required
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lab_report', 'email_to');
  }
};
