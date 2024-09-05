const { Sequelize } = require('sequelize');

// Setup your database connection
const sequelize = new Sequelize('reportWebsite', 'root', 'gpdata01', {
  host: '104.154.101.240',
  dialect: 'mysql', // or 'postgres', 'sqlite', etc.
  logging: false, // You can turn logging on for debugging
  // other Sequelize configurations
});

module.exports = sequelize;
