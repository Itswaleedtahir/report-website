"use strict";
module.exports = (sequelize, DataTypes) => {
  const Signup = sequelize.define(
    "Datas",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    {
      tableName: "Datas",
      timestamps: true,
    }
  );

  return Signup;
};
