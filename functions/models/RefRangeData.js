"use strict";
module.exports = (sequelize, DataTypes) => {
  const  RefRangeData = sequelize.define(
    "ref_range_data",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      lab_name:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      labProvider:{
        type: DataTypes.STRING,
        allowNull: false,
      },
      refValue: {
        type: DataTypes.STRING, // Change from DATE to STRING
        allowNull: false,
      },
    },
    {
      tableName: "ref_range_data",
      timestamps: true,
    }
  )
  return RefRangeData;
};
