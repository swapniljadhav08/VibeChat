const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },
    content: {
        type: String, // Text content or Cloudinary URL for media
        required: true
    },
    expiresIn: {
        type: Number, // seconds until message disappears
        default: 0
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
