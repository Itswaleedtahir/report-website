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
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      
      PdfEmails.belongsTo(models.users, {
        foreignKey: { name: "userEmailFk" },
        as: "user", // Alias for associated user
      });

      PdfEmails.hasMany(models.lab_report, {
    foreignKey: 'pdfEmailIdfk',
    as: 'labReports'
  });
  };

  return PdfEmails;
};
