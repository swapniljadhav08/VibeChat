const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend');
const { requireAuth } = require('../middleware/auth');

router.get('/search', requireAuth, friendController.searchUsers);
router.get('/', requireAuth, friendController.getFriends);
router.get('/requests', requireAuth, friendController.getFriendRequests);
router.post('/request', requireAuth, friendController.sendRequest);
router.post('/accept', requireAuth, friendController.acceptRequest);

module.exports = router;
