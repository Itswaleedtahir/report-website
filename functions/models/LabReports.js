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
        type:DataTypes.STRING,
        allowNull: false,
      },
      timePoint:{
        type:DataTypes.STRING,
        allowNull: false,
      },
      email_to: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      time_of_collection:{
        type:DataTypes.STRING,
        allowNull: true,
        defaultValue: "07:38"
      }
    },
    {
      tableName: "lab_report",
      timestamps: true,
    }
  )
  LapReports.associate = function(models) {
    LapReports.belongsTo(models.pdf_email,  { 
      foreignKey: { name: 'pdfEmailIdfk' },
      as: 'pdfEmailId',});
          // Association with labreport_data
    LapReports.hasMany(models.labreport_data, {
      foreignKey: 'labReoprtFk',
      as: 'labreport_data'
    });
  };
  return LapReports;
};
