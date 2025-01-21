const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const urlDB = process.env.MYSQL_URL;

// Initialize session store using the URL directly
const sessionStore = new MySQLStore({}, urlDB);

// Session middleware configuration
app.use(session({
    key: 'sessionId',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));
// DEV
// const mysql = require('mysql2/promise');
// require('dotenv').config();
// // const urlDB = 'mysql://root:UDzcFkUdZdJFOmducOpUICxYRpVZuXXo@mysql.railway.internal:3306/railway'

// const pool = mysql.createPool({
//     host: process.env.DB_HOST || 'localhost',
//     user: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME || 'wepray',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

// module.exports = pool;

