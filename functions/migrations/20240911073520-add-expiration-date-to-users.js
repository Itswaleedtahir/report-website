'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'users', // name of Source table
      'expirationDate', // name of the key we're adding 
      {
        type: Sequelize.DATE,
        allowNull: true,
        after: "isArchived" // positions the new column after `isArchived` column
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'users', // name of Source table
      'expirationDate' // key we want to remove
    );
  }
};
