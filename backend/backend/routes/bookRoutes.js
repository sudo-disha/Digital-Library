const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bookDb = require('../bookDb');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Serve static files from the "uploads" folder
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add a new book
router.post('/addBook', upload.fields([{ name: 'bookposter', maxCount: 1 }, { name: 'bookpdf', maxCount: 1 }]), (req, res) => {
  const { isbn, title, author, description, category, department } = req.body;
  const bookposter = req.files['bookposter'][0].filename;
  const bookpdf = req.files['bookpdf'][0].filename;

  const sql = 'INSERT INTO books (isbn, title, author, description, category, department, bookposter, bookpdf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  bookDb.query(sql, [isbn, title, author, description, category, department, bookposter, bookpdf], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error adding book' });
    } else {
      res.status(200).json({ message: 'Book added successfully' });
    }
  });   
});

// Get all books
router.get('/getBooks', (req, res) => {
  const sql = 'SELECT * FROM books';
  bookDb.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving books' });
    } else {
      res.status(200).json(results);
    }
  });
});
router.get('/getBooksByDepartment/:department', (req, res) => {
  const department = req.params.department;

  const sql = 'SELECT * FROM books WHERE department = ?';
  bookDb.query(sql, [department], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving books by department' });
    } else {
      res.status(200).json(results);
    }
  });
});
// Get books by category
router.get('/getBooksByCategory/:category', (req, res) => {
  const category = req.params.category;

  const sql = 'SELECT * FROM books WHERE category = ?';
  bookDb.query(sql, [category], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving books by category' });
    } else {
      res.status(200).json(results);
    }
  });
});
// Add a new endpoint to fetch departments
router.get('/getDepartments', (req, res) => {
  const sql = 'SELECT DISTINCT department FROM books'; // Query to retrieve distinct departments
  bookDb.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving departments' });
    } else {
      const departments = results.map((row) => row.department); // Extract department names from the results
      res.status(200).json(departments);
    }
  });
});

// Update a book (including department)
router.patch('/updateBook/:id', upload.fields([{ name: 'bookposter', maxCount: 1 }, { name: 'bookpdf', maxCount: 1 }]), (req, res) => {
  const bookId = req.params.id; // Change 'serial' to 'id'
  const { isbn, title, author, description, category, department } = req.body;
  const bookposter = req.files['bookposter'] ? req.files['bookposter'][0].filename : null;
  const bookpdf = req.files['bookpdf'] ? req.files['bookpdf'][0].filename : null;

  // Build the SET clause for the SQL query based on the provided fields
  const setClauses = [];
  if (isbn) setClauses.push('isbn=?');
  if (title) setClauses.push('title=?');
  if (author) setClauses.push('author=?');
  if (description) setClauses.push('description=?');
  if (category) setClauses.push('category=?');
  if (department) setClauses.push('department=?');
  if (bookposter) setClauses.push('bookposter=?');
  if (bookpdf) setClauses.push('bookpdf=?');

  if (setClauses.length === 0) {
    // No fields to update
    return res.status(400).json({ message: 'No fields to update' });
  }
  router.patch('/updateBookField/:id', (req, res) => {
    const bookId = req.params.id;
    const { field, value } = req.body; // Field and new value to update
  
    // Check if the field is a valid field to update
    const validFields = ['isbn', 'title', 'author', 'description', 'category', 'department', 'bookposter', 'bookpdf'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ message: 'Invalid field to update' });
    }
  
    // Construct the SQL query dynamically based on the field
    const sql = `UPDATE books SET ${field}=? WHERE id=?`;
    bookDb.query(sql, [value, bookId], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating book field' });
      } else {
        res.status(200).json({ message: `Book ${field} updated successfully` });
      }
    });
  });
  
  // Build the SQL query dynamically
  const sql = `UPDATE books SET ${setClauses.join(', ')} WHERE id=?`;
  const values = [isbn, title, author, description, category, department, bookposter, bookpdf, bookId].filter((value) => value !== null);

  bookDb.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating book' });
    } else {
      res.status(200).json({ message: 'Book updated successfully' });
    }
  });
});
// Delete a book
router.delete('/deleteBook/:id', (req, res) => {
  const bookId = req.params.id; // Change 'serial' to 'id'

  const sql = 'DELETE FROM books WHERE id=?';
  bookDb.query(sql, [bookId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error deleting book' });
    } else {
      res.status(200).json({ message: 'Book deleted successfully' });
    }
  });
});

module.exports = router;
