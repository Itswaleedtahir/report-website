"use strict";
module.exports = (sequelize, DataTypes) => {
  const LapReportData = sequelize.define(
    "labreport_data",
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
      protocolId: {
        type: DataTypes.STRING,
      },
      key:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      value:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      refValue: {
        type:DataTypes.STRING,
        allowNull: false,
      },
      isPending:{
        type:DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: "labreport_data",
      timestamps: true,
    }
  )
  LapReportData.associate = function(models) {
    LapReportData.hasMany(models.lab_report, { 
      foreignKey: { name: 'labReoprtFk' },
      as: 'labReoprt'})
  };
  return LapReportData;
};
