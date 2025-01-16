const mysql = require('mysql2/promise');
require('dotenv').config();
const urlDB = 'mysql://root:UDzcFkUdZdJFOmducOpUICxYRpVZuXXo@mysql.railway.internal:3306/railway'

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME || 'wepray',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

const pool = mysql.createPool(urlDB);


module.exports = pool;


// const mysql = require('mysql2/promise');
// require('dotenv').config();
// const urlDB = 'mysql://root:UDzcFkUdZdJFOmducOpUICxYRpVZuXXo@mysql.railway.internal:3306/railway'

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME || 'wepray',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// // const pool = mysql.createPool(urlDB);


// module.exports = pool;