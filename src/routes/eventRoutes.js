const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const verifyToken = require('../middleware/auth');


router.post('/groups', verifyToken, eventController.createEventGroup);
router.get('/my-events', verifyToken, eventController.getMyEvents);
router.get('/:id', verifyToken, eventController.getEvent);
router.patch('/:id/status', verifyToken, eventController.toggleStatus);
router.get('/:id/export', verifyToken, eventController.exportEventStats);
router.get('/groups/:groupId/export', verifyToken, eventController.exportGroupStats);
router.delete('/:id', verifyToken, eventController.deleteEvent);
router.delete('/groups/:groupId', verifyToken, eventController.deleteGroup);

module.exports = router;