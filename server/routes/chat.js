const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const chatController = require('../controllers/chat');

// All chat routes require authentication
router.use(requireAuth);

router.get('/users', chatController.getUsers);
router.get('/', chatController.getChats);
router.post('/', chatController.createChat);
router.post('/send-snap', chatController.sendSnapToFriends);
router.get('/:chatId/messages', chatController.getMessages);
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;
