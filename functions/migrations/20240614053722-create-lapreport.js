'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('lab_report', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pdfEmailIdfk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'pdf_email',
          key: 'id'
        }
      },
      protocolId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      investigator:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      subjectId:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateOfCollection: {
        type:Sequelize.DATE,
        allowNull: false,
      },
      timePoint:{
        type:Sequelize.STRING,
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
    await queryInterface.dropTable('lab_report');
  }
};
