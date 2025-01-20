'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('labreport_data', 'pdfEmailIdFk', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Temporarily allow NULL
      references: {
        model: 'pdf_email',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('labreport_data', 'pdfEmailIdFk');
  }
};
