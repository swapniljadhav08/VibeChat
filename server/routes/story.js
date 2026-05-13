const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const storyController = require('../controllers/story');

// All story routes require authentication
router.use(requireAuth);

router.post('/', storyController.createStory);
router.get('/feed', storyController.getFeed);
router.post('/:id/view', storyController.markViewed);
router.delete('/:id', storyController.deleteStory);

module.exports = router;
