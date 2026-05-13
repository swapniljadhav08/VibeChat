const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

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
            timeout: 120000 // 120 seconds timeout for large video files
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

// @route   POST /api/upload/media
// @desc    Upload a large media file (video/image) using multipart/form-data
// @access  Private
router.post('/media', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Upload large files using chunked streaming
        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(req.file.path, {
                folder: 'vibechat/stories',
                resource_type: 'auto',
                timeout: 120000,
                chunk_size: 6000000 // 6MB chunks
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        // Clean up the temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            message: 'Media uploaded successfully',
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id
        });

    } catch (error) {
        console.error('Cloudinary upload_large error:', error);
        // Clean up temp file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error?.message || error?.error?.message || 'Failed to upload media file' });
    }
});

module.exports = router;
