const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { pool } = require('../database/dbConfig');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: './public/adminProfileImages/',
  filename: (req, file, callback) => {
    callback(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB
}).single('adminProfileImage');

// Admin registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user with this email already exists
    const userWithEmail = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (userWithEmail.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new admin into the database
    await pool.query(
      'INSERT INTO admins (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user with this email exists
    const user = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and assign a token (you can use JWT here)
    const token = 'your_generated_token';

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin profile route
router.get('/profile', async (req, res) => {
  try {
    // Get the admin details from the database (replace with your authentication logic)
    const admin = { username: 'admin_username', email: 'admin_email' };

    res.json(admin);
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update admin profile route
router.put('/profile', async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading admin profile image:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      const { username, email } = req.body;
      const adminProfileImage = req.file.filename;

      // Update the admin profile in the database (replace with your logic)
      const updatedAdmin = { username, email, adminProfileImage };

      res.json({ message: 'Admin profile updated successfully', admin: updatedAdmin });
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
