'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('ref_range_data', 'key', 'laboratory_name');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('ref_range_data', 'laboratory_name', 'key');
  }
};
