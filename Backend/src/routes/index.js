const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.send(`Welcome to the Job Ready Resume API! and the server is running on port ${process.env.PORT}`);
});

module.exports = router;