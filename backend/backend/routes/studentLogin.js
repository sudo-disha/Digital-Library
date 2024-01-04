const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Login route
router.post('/login', (req, res) => {
  const { student_id, password } = req.body;

  // Check if the student with the provided student_id exists
  const checkUserQuery = 'SELECT * FROM students WHERE student_id = ?';
  db.query(checkUserQuery, [student_id])
    .then((results) => {
      if (results[0].length === 0) {
        // Student with the given student_id not found
        res.status(401).json({ message: 'Authentication failed. User not found.' });
        return;
      }

      const user = results[0][0];

      // Check if the provided password matches the hashed password in the database
      bcrypt.compare(password, user.password, (err, passwordMatch) => {
        if (err || !passwordMatch) {
          // Password does not match
          res.status(401).json({ message: 'Authentication failed. Incorrect password.' });
        } else {
          // Password matches, user is authenticated
          res.status(200).json({ message: 'Authentication successful' });
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error authenticating student' });
    });
});

module.exports = router;
