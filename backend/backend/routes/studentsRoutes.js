const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const excelToJson = require('convert-excel-to-json');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Add a new student
router.post('/addStudent', (req, res) => {
  const { student_id, name, class_name, password } = req.body;

  const sql = 'INSERT INTO students (student_id, name, class_name, password) VALUES (?, ?, ?, ?)';
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
  db.query(sql, [student_id, name, class_name, hashedPassword])
    .then(() => {
      res.status(200).json({ message: 'Student added successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error adding student' });
    });
});

// Import students from Excel
router.post('/importStudents', upload.single('excelFile'), (req, res) => {
  const excelFilePath = req.file.path;

  const result = excelToJson({
    sourceFile: excelFilePath,
    header: {
      rows: 1,
    },
    columnToKey: {
      A: 'student_id',
      B: 'name',
      C: 'class_name',
      D: 'password', // Assuming this column contains plain text passwords
    },
  });

  const studentsData = result.Sheet1;

  if (studentsData.length === 0) {
    return res.status(400).json({ message: 'No data found in the Excel file' });
  }

  // Hash passwords and insert each row separately
  const sql = 'INSERT INTO students (student_id, name, class_name, password) VALUES (?, ?, ?, ?)';
  
  const insertPromises = studentsData.map((student) => {
    const { student_id, name, class_name, password } = student;
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password using bcrypt
    return db.query(sql, [student_id, name, class_name, hashedPassword]);
  });

  Promise.all(insertPromises)
    .then(() => {
      res.status(200).json({ message: 'Students imported successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error importing students from Excel' });
    });
});
// Get all students
router.get('/getStudents', (req, res) => {
  const sql = 'SELECT * FROM students';
  db.query(sql)
    .then((results) => {
      res.status(200).json(results[0]);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving students' });
    });
});

// Get student detail by ID
router.get('/getStudent/:id', (req, res) => {
  const studentId = req.params.id;
  const sql = 'SELECT * FROM students WHERE id = ?';

  db.query(sql, [studentId])
    .then((results) => {
      if (results[0].length > 0) {
        res.status(200).json(results[0][0]);
      } else {
        res.status(404).json({ message: 'Student not found' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving student detail' });
    });
});

// Update student details
router.put('/updateStudent/:id', (req, res) => {
  const studentId = req.params.id;
  const { student_id, name, class_name, password } = req.body;

  const sql = 'UPDATE students SET student_id=?, name=?, class_name=?, password=? WHERE id=?';
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
  db.query(sql, [student_id, name, class_name, hashedPassword, studentId])
    .then(() => {
      res.status(200).json({ message: 'Student updated successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error updating student' });
    });
});

// Delete a student
router.delete('/deleteStudent/:id', (req, res) => {
  const studentId = req.params.id;
  const sql = 'DELETE FROM students WHERE id = ?';

  db.query(sql, [studentId])
    .then(() => {
      res.status(200).json({ message: 'Student deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: 'Error deleting student' });
    });
});

module.exports = router;
