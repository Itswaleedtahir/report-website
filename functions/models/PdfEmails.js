"use strict";
module.exports = (sequelize, DataTypes) => {
  const PdfEmails = sequelize.define(
    "pdf_email",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      emailAddress: {
        type: DataTypes.STRING
      },
      receivedAt: {
        type: DataTypes.DATE
      },
      pdfName:{
        type: DataTypes.STRING
      },
      pdfPath:{
        type: DataTypes.STRING
      },
    },
    {
      tableName: "pdf_email",
      timestamps: true,
    }
  )

  return PdfEmails;
};
