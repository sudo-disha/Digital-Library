const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const contentDb = require('../contentDb');
const mysql = require('mysql2/promise');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Fetch material types from the database
const getMaterialTypes = async () => {
  try {
    const connection = await mysql.createConnection(contentDb.config);
    const sql = 'SELECT DISTINCT material_type FROM content';
    const [results] = await connection.execute(sql);
    connection.end();
    return results.map((row) => row.material_type);
  } catch (err) {
    console.error(err);
    return [];
  }
};

// Add a new content
// Add a new content with a manually specified uploaded date
router.post('/addContent', upload.single('studyMaterial'), async (req, res) => {
  const { teacherId, className, subject, category, materialType, uploadedAt } = req.body;
  const studyMaterial = req.file ? req.file.filename : null;

  try {
    const connection = await mysql.createConnection(contentDb.config);

    // Check if the provided teacherId exists in the teachers table
    const teacherExistsSql = 'SELECT COUNT(*) as teacherCount FROM teachers WHERE id = ?';
    const [teacherExistsResults] = await connection.execute(teacherExistsSql, [teacherId]);

    if (teacherExistsResults[0].teacherCount === 0) {
      connection.end();
      return res.status(400).json({ message: 'Teacher not found' });
    }

    const sql = 'INSERT INTO content (teacher_id, class_name, subject, category, study_material, material_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await connection.execute(sql, [teacherId, className, subject, category, studyMaterial, materialType, uploadedAt]);

    connection.end();

    res.status(200).json({ message: 'Content added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding content' });
  }
});

// Get all content
router.get('/getContent', async (req, res) => {
  try {
    const connection = await mysql.createConnection(contentDb.config);

    const sql = 'SELECT * FROM content';
    const [results] = await connection.execute(sql);

    connection.end();

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving content' });
  }
});

router.get('/getContentWithTeacherNames', async (req, res) => {
  try {
    const connection = await mysql.createConnection(contentDb.config);

    // Join the 'content' table with the 'teachers' table to get teacher names
    const sql = 'SELECT content.*, teachers.name as teacher_name FROM content JOIN teachers ON content.teacher_id = teachers.id';
    const [results] = await connection.execute(sql);

    connection.end();

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving content with teacher names' });
  }
});

// Get video by filename
router.get('/getVideo/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const fileStream = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        fileStream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      res.status(404).send('Video not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Get PDF by filename
router.get('/getPdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  try {
    if (fs.existsSync(filePath)) {
      // Set the content type to application/pdf
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(filePath);
    } else {
      res.status(404).send('PDF not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Get PPT by filename
router.get('/getPpt/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  try {
    if (fs.existsSync(filePath)) {
      // Set the content type to the PPTX format
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.sendFile(filePath);
    } else {
      res.status(404).send('PPTX not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Update content details
// Update a specific field of a content entry
router.put('/updateContent/:id', async (req, res) => {
  const contentId = req.params.id;
  const { field, value } = req.body; // Field and new value to update

  try {
    const connection = await mysql.createConnection(contentDb.config);

    // Check if the field is a valid field to update
    const validFields = ['teacher_id', 'class_name', 'subject', 'category', 'material_type'];
    if (!validFields.includes(field)) {
      connection.end();
      return res.status(400).json({ message: 'Invalid field to update' });
    }

    // Construct the SQL query dynamically based on the field
    const sql = `UPDATE content SET ${field}=? WHERE id=?`;
    await connection.execute(sql, [value, contentId]);

    connection.end();

    res.status(200).json({ message: `Content ${field} updated successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating content' });
  }
});

// Delete content
router.delete('/deleteContent/:id', async (req, res) => {
  const contentId = req.params.id;

  try {
    const connection = await mysql.createConnection(contentDb.config);

    const sql = 'DELETE FROM content WHERE id = ?';
    await connection.execute(sql, [contentId]);

    connection.end();

    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting content' });
  }
});

// Get material types for the Material Type filter
router.get('/getMaterialTypes', async (req, res) => {
  const materialTypes = await getMaterialTypes();
  res.status(200).json(materialTypes);
});

module.exports = router;
