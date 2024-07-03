"use strict";
module.exports = (sequelize, DataTypes) => {
  const Signup = sequelize.define(
    "users",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      user_email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      token:{
        type:DataTypes.STRING,
        allowNull:true
      },
      access:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue: 'Resume'
      }
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  return Signup;
};
