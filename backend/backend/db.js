const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '10.10.61.161',
  user: 'disha',
  password: '',
  database: 'student_records',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
  } else {
    console.log('Connected to MySQL database');
    connection.release();
  }
});

module.exports = pool.promise();
