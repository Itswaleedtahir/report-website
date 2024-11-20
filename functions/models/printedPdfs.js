"use strict";
module.exports = (sequelize, DataTypes) => {
  const printedPdf = sequelize.define(
    "printedPdfs",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      pdfEmailIdfk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'pdf_email',
          key: 'id'
        }
      },
      pdfUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isSigned: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPrinted: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_to: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      printedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      protocolId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subjectId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateOfCollection: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timePoint: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt:{
        type: DataTypes.DATE,
        allowNull: false,
  
      },
      updatedAt:{
        type: DataTypes.DATE,
        allowNull: false,
      }
    },
    {
      tableName: "printedPdfs",
      timestamps: true,
    }
  );

  return printedPdf;
};
