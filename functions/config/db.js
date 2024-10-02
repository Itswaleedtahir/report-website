const { Sequelize } = require('sequelize');

// Setup your database connection
const sequelize = new Sequelize('reportWebsite', 'root', 'gpdata01', {
  host: '104.154.101.240',
  dialect: 'mysql', // or 'postgres', 'sqlite', etc.
  logging: false, // You can turn logging on for debugging
  pool: {
    max: 10, // Maximum number of connections in pool
    min: 0,  // Minimum number of connections in pool
    acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000 // The maximum time, in milliseconds, that a connection can be idle before being released
  }
  // other Sequelize configurations
});

module.exports = sequelize;
