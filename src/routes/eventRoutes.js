const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const verifyToken = require('../middleware/auth');


router.post('/groups', verifyToken, eventController.createEventGroup);
router.get('/:id', verifyToken, eventController.getEvent);
router.patch('/:id/status', verifyToken, eventController.toggleStatus); 



// router.get('/:id/export', verifyToken, eventController.exportEventCsv);

module.exports = router;