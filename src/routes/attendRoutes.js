const express = require('express');
const router = express.Router();
const attendController = require('../controllers/attendController');
const verifyToken = require('../middleware/auth');

router.post('/join', verifyToken, attendController.joinEvent);

module.exports = router;