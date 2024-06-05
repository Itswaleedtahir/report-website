'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('labreport_data', 'refValue', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('labreport_data', 'refValue', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  }
};
