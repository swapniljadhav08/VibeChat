const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaUrl: {
        type: String,
        required: true // Cloudinary URL
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    location: {
        lat: Number,
        lng: Number
    },
    isMapStory: {
        type: Boolean,
        default: false
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Story', StorySchema);
