"use strict";
module.exports = (sequelize, DataTypes) => {
  const LapReportEmail = sequelize.define(
    "labreport_email",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      labReoprtFk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {         // User belongsTo Company 1:1
          model: 'lab_report',
          key: 'id'
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emailStatus:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      csvPath:{
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "labreport_email",
      timestamps: true,
    }
  )
  LapReportEmail.associate = function(models) {
    LapReportEmail.belongsTo(models.lab_report, { 
      foreignKey: { name: 'labReoprtFk' },
      as: 'labReoprt'})
  };
  return LapReportEmail;
};
