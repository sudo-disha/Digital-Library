const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const db = require('../teacherDb'); // Assuming you have a teacher database configuration

// Teacher login route
router.post('/teacherLogin', async (req, res) => {
  const { username, password } = req.body; // Change 'name' to 'username' to match the input field name

  try {
    const connection = await mysql.createConnection(db.config);

    // Retrieve the teacher's data by username
    const sql = 'SELECT * FROM teachers WHERE username = ?'; // Change 'name' to 'username' in the SQL query
    const [results] = await connection.execute(sql, [username]);

    connection.end();

    if (results.length === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const teacher = results[0];

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, teacher.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Success message
    const successMessage = 'Login successful';

    // You can customize the response data here
    const responseData = {
      id: teacher.id,
      username: teacher.username, // Include username
      name: teacher.name,
      department: teacher.department,
      message: successMessage,
      role: 'teacher' // Include success message
      // Add more fields as needed
    };

    res.status(200).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
