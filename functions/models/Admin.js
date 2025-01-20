"use strict";
module.exports = (sequelize, DataTypes) => {
  const Signup = sequelize.define(
    "admin",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      user_email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "admin",
      timestamps: true,
    }
  );

  return Signup;
};
