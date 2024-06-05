"use strict";
module.exports = (sequelize, DataTypes) => {
  const LapReports = sequelize.define(
    "lab_report",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },  
      pdfEmailIdfk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'pdf_email',
          key: 'id'
        }
      },
     protocolId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      investigator:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      subjectId:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateOfCollection: {
        type:DataTypes.DATE,
        allowNull: false,
      },
      timePoint:{
        type:DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "lab_report",
      timestamps: true,
    }
  )
  LapReports.associate = function(models) {
    LapReports.belongsTo(models.pdf_email,  { 
      foreignKey: { name: 'pdfEmailIdfk' },
      as: 'pdfEmailId',})
  };
  return LapReports;
};
