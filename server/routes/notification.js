const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { requireAuth } = require('../middleware/auth');

// Assuming auth middleware is similar to other routes
// I'll check it in a sec, using requireAuth as placeholder or standard
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;
