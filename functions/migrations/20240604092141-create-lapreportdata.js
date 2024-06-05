'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('labreport_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      labReoprtFk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'lab_report',
          key: 'id'
        }
      },
      protocolId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      key:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      value:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      refValue: {
        type: Sequelize.STRING, // Change from DATE to STRING
        allowNull: false,
      },
      isPending:{
        type:Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable('labreport_data');
  }
};
