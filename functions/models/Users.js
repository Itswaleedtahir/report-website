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
      token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      access: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Resume'
      },
      invitedBy: { // New column for who invited the user
        type: DataTypes.STRING,
        allowNull: true
      },
      isEmployee: { // New boolean column to indicate if the user is an employee
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      isArchived:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      expirationDate: { // New Date field for invitation expiration
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  return Signup;
};
