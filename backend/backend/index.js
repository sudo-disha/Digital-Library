const express = require('express');
const cors = require('cors');
const session = require('express-session');
const redis = require('redis');
const app = express();
const port = 3001;

const client = redis.createClient(); // Create a Redis client

app.use(cors());
app.use(express.json());

const studentsRoutes = require('./routes/studentsRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const contentRoutes = require('./routes/contentRoutes');
const bookRoutes = require('./routes/bookRoutes');
const studentLogin = require('./routes/studentLogin');
const teacherLogin = require('./routes/teacherLogin');
const adminLogin = require('./routes/adminLogin');

app.use('/api/books', bookRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/studentlogin', studentLogin);
app.use('/api/teacherlogin', teacherLogin);
app.use('/api/adminlogin', adminLogin);

// Middleware to increment visitor count on each request
app.use((req, res, next) => {
  client.incr('visitorCount', (err, count) => {
    if (err) {
      console.error('Error incrementing visitor count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      next();
    }
  });
});

app.get('/api/visitors/count', (req, res) => {
  client.get('visitorCount', (err, count) => {
    if (err) {
      console.error('Error fetching visitor count:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ count: parseInt(count) || 0 });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
