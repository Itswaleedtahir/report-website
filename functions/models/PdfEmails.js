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
      userEmailFk:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'users',
          key: 'id'
        }
      },
      email_to: {
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
      isSigned:{
        type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
      }
    },
    {
      tableName: "pdf_email",
      timestamps: true,
    }
  )
  PdfEmails.associate = function(models) {
    PdfEmails.belongsTo(models.pdf_email,  { 
      foreignKey: { name: 'userEmailFk' },
      as: 'userEmailId',})
  };

  return PdfEmails;
};
