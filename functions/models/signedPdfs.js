"use strict";
module.exports = (sequelize, DataTypes) => {
  const signedPdf = sequelize.define(
    "signedPdfs",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      pdf_id: {
        allowNull: false,
        type: DataTypes.STRING
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
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isPrinted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_to: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signedBy: {
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
      }
    },
    {
      tableName: "signedPdfs",
      timestamps: true,
    }
  );

  return signedPdf;
};
