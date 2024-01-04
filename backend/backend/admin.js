const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Your MySQL database configuration
const dbConfig = {
  host: '10.10.61.161',
  user: 'disha',
  password: '',
  database: 'adminDb',
};

async function insertAdmin() {
  const connection = await mysql.createConnection(dbConfig);

  const username = 'aktiwari';
  const plainPassword = 'aktiwaridc'; // Replace with the actual plain password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const [rows] = await connection.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    console.log('Admin inserted successfully');
  } catch (error) {
    console.error('Error inserting admin:', error);
  } finally {
    connection.end();
  }
}

insertAdmin();
