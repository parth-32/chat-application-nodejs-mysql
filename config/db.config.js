const mysql = require('mysql')

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "chat_api",
    password: ""
})

module.exports = pool