'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('lab_report', 'time_of_collection', {
      type: Sequelize.STRING,
      allowNull: true, // or false, based on your requirements
      defaultValue: "07:38" // setting the default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lab_report', 'time_of_collection');
  }
};
