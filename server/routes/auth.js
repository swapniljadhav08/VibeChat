const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { syncUser, updateProfile } = require('../controllers/auth');

// POST /api/auth/sync
// Private route - requires valid Firebase ID token in Authorization header
router.post('/sync', requireAuth, syncUser);

// PUT /api/auth/profile
// Private route - updates user profile (photoURL, displayName)
router.put('/profile', requireAuth, updateProfile);

module.exports = router;
