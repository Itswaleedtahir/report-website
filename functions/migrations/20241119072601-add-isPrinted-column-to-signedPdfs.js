'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the isPrinted column to the signedPdfs table
    await queryInterface.addColumn('signedPdfs', 'isPrinted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the isPrinted column if rolled back
    await queryInterface.removeColumn('signedPdfs', 'isPrinted');
  },
};
