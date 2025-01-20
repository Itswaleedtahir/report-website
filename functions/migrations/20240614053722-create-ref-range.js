'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ref_range_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      lab_name:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      labProvider:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      refValue: {
        type: Sequelize.STRING, // Change from DATE to STRING
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ref_range_data');
  }
};
