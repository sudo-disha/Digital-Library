// visitorRoutes.js

const express = require('express');
const router = express.Router();

let visitorCount = 0;

// Endpoint to get the current visitor count
router.get('/count', (req, res) => {
  res.json({ count: visitorCount });
});

// Middleware to increment the visitor count for every request
router.use((req, res, next) => {
  visitorCount++;
  next();
});

module.exports = router;
