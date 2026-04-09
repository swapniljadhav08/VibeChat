const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const mapController = require('../controllers/mapController');

router.use(requireAuth);

router.get('/data', mapController.getMapData);
router.post('/privacy', mapController.updatePrivacy);
router.post('/story', mapController.postMapStory);

module.exports = router;
