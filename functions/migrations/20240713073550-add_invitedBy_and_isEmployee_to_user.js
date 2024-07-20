'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'users', // table name
      'invitedBy', // new field name
      {
        type: Sequelize.STRING,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      'users', // table name
      'isEmployee', // new field name
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'invitedBy');
    await queryInterface.removeColumn('users', 'isEmployee');
  }
};
