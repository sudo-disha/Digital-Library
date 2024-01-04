const mysql = require('mysql');

const bookDb = mysql.createConnection({
  host: '10.10.61.161',
  user: 'disha',
  password: '',
  database: 'digital_library', // Your database name
});

bookDb.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to MySQL database');
});

module.exports = bookDb;