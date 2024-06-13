'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('labreport_data', 'key', 'laboratory_name');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('labreport_data', 'laboratory_name', 'key');
  }
};
