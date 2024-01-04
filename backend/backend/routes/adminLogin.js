const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration for Admin
const adminDbConfig = {
  host: '10.10.61.161',
  user: 'disha',
  password: '',
  database: 'adminDb',
};

// Admin login route
router.post('/adminLogin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await mysql.createConnection(adminDbConfig); // Use the admin database configuration

    // Retrieve the admin's data by username
    const sql = 'SELECT * FROM admins WHERE username = ?';
    const [results] = await connection.execute(sql, [username]);

    connection.end();

    if (results.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = results[0];

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // You can customize the response data here
    const responseData = {
      id: admin.id,
      username: admin.username,
      role: 'admin', // Add the role here
      // Add more fields as needed
      message: 'Login successful', // Custom success message
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
