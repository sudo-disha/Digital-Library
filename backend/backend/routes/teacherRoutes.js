const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../teacherDb');
const mysql = require('mysql2/promise');
const excelToJson = require('convert-excel-to-json');
const bcrypt = require('bcrypt');

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add a new teacher
router.post('/addTeacher', upload.single('profilePhoto'), async (req, res) => {
  const { name, contactNumber, department, username, password } = req.body;
  const profilePhoto = req.file ? req.file.filename : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await mysql.createConnection(db.config);

    const sql = 'INSERT INTO teachers (name, contact_number, department, username, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?)';
    await connection.execute(sql, [name, contactNumber, department, username, hashedPassword, profilePhoto]);

    connection.end();

    res.status(200).json({ message: 'Teacher added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding teacher' });
  }
});

// Import teachers from Excel
router.post('/importTeachers', upload.single('excelFile'), async (req, res) => {
  const excelFilePath = req.file.path;

  try {
    const result = excelToJson({
      sourceFile: excelFilePath,
      header: {
        rows: 1,
      },
      columnToKey: {
        A: 'name',
        B: 'contactNumber',
        C: 'department',
        D: 'username', // Add username column
        E: 'password', // Assuming passwords are already hashed
        F: 'profilePhoto', // Include profile photo if needed
      },
    });

    const teachersData = result.Sheet1; // Assuming the sheet name is 'Sheet1'

    const connection = await mysql.createConnection(db.config);

    const sql = 'INSERT INTO teachers (name, contact_number, department, username, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?)';
    const values = teachersData.map((teacher) => [
      teacher.name,
      teacher.contactNumber,
      teacher.department,
      teacher.username,
      teacher.password,
      teacher.profilePhoto,
    ]);

    await connection.execute(sql, values);

    connection.end();

    res.status(200).json({ message: 'Teachers imported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error importing teachers from Excel' });
  }
});

// Get all teachers
router.get('/getTeachers', async (req, res) => {
  try {
    const connection = await mysql.createConnection(db.config);

    const sql = 'SELECT * FROM teachers';
    const [results] = await connection.execute(sql);

    connection.end();

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving teachers' });
  }
});
// Add this route to your teacher backend
router.get('/getTeacherNames', async (req, res) => {
  try {
    const connection = await mysql.createConnection(db.config);

    const sql = 'SELECT id, name FROM teachers'; // Select teacher IDs and names
    const [results] = await connection.execute(sql);

    connection.end();

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving teacher names' });
  }
});

// Update teacher details
router.put('/updateTeacher/:id', async (req, res) => {
  const teacherId = req.params.id;
  const { name, contactNumber, department, username, password, profilePhoto } = req.body;

  try {
    const connection = await mysql.createConnection(db.config);

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name=?');
      values.push(name);
    }

    if (contactNumber !== undefined) {
      updateFields.push('contact_number=?');
      values.push(contactNumber);
    }

    if (department !== undefined) {
      updateFields.push('department=?');
      values.push(department);
    }

    if (username !== undefined) {
      updateFields.push('username=?');
      values.push(username);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password=?');
      values.push(hashedPassword);
    }

    if (profilePhoto !== undefined) {
      updateFields.push('profile_photo=?');
      values.push(profilePhoto);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const sql = `UPDATE teachers SET ${updateFields.join(', ')} WHERE id=?`;
    values.push(teacherId);

    await connection.execute(sql, values);

    connection.end();

    res.status(200).json({ message: 'Teacher updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating teacher' });
  }
});

// Delete a teacher
router.delete('/deleteTeacher/:id', async (req, res) => {
  const teacherId = req.params.id;

  try {
    const connection = await mysql.createConnection(db.config);

    const sql = 'DELETE FROM teachers WHERE id = ?';
    await connection.execute(sql, [teacherId]);

    connection.end();

    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting teacher' });
  }
});
router.get('/getDepartments', async (req, res) => {
  try {
    const connection = await mysql.createConnection(db.config);

    const sql = 'SELECT DISTINCT department FROM teachers'; // Select distinct department names
    const [results] = await connection.execute(sql);

    connection.end();

    const departments = results.map((result) => result.department);

    res.status(200).json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving department names' });
  }
});
module.exports = router;
