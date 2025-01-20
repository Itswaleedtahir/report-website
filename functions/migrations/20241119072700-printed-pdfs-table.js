'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('printedPdfs', {
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
      pdfUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isSigned: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isPrinted:{
        type: Sequelize.STRING,
        allowNull: true
      },
      email_to:{
        type: Sequelize.STRING,
        allowNull: true
      },
      printedBy:{
        type: Sequelize.STRING,
        allowNull: true
      },
      protocolId:{
        type: Sequelize.STRING,
        allowNull: true
      },
      subjectId:{
        type: Sequelize.STRING,
        allowNull: true
      },
      dateOfCollection:{
        type: Sequelize.STRING,
        allowNull: true
      },
      timePoint:{
        type: Sequelize.STRING,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('printedPdfs');
  }
};
