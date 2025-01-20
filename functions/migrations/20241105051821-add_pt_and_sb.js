"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("signedPdfs", "protocolId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("signedPdfs", "subjectId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("signedPdfs", "dateOfCollection", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("signedPdfs", "protocolId");
    await queryInterface.removeColumn("signedPdfs", "subjectId");
    await queryInterface.removeColumn("signedPdfs", "dateOfCollection");
  },
};
