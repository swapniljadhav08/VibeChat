const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/upload/snap
// @desc    Upload a captured snap (base64) to Cloudinary
// @access  Private
router.post('/snap', requireAuth, async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        const uid = req.firebaseUser.uid;

        if (!imageBase64) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // Upload the base64 string directly to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
            folder: 'vibechat/snaps',
            resource_type: 'auto',
        });

        res.status(200).json({
            message: 'Image uploaded successfully',
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id
        });

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
