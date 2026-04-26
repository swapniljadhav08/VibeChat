const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { syncUser, updateProfile, updateFcmToken } = require('../controllers/auth');

// POST /api/auth/sync
// Private route - requires valid Firebase ID token in Authorization header
router.post('/sync', requireAuth, syncUser);

// PUT /api/auth/profile
// Private route - updates user profile (photoURL, displayName)
router.put('/profile', requireAuth, updateProfile);

// PUT /api/auth/fcm-token
// Private route - updates user's FCM token for push notifications
router.put('/fcm-token', requireAuth, updateFcmToken);

module.exports = router;
