const mysql = require('mysql2');  // Import MySQL library to interact with the database
require('dotenv').config();  // Load environment variables from .env file

// **Create a MySQL connection pool**
const pool = mysql.createPool({
    host: process.env.DB_HOST,  // MySQL server address (usually 'localhost' for local development)
    user: process.env.DB_USER,  // MySQL username (default: 'root')
    password: process.env.DB_PASS,  // MySQL password (set during MySQL installation)
    database: process.env.DB_NAME,  // Name of the database being used
    waitForConnections: true,  // Allow queueing of requests if all connections are busy
    connectionLimit: 10,  // Maximum number of connections in the pool (adjust as needed)
    queueLimit: 0  // No limit on request queue (0 means unlimited)
});

// **Export the connection pool for use in other parts of the app**
module.exports = pool.promise();  // Allows database queries to use async/await
