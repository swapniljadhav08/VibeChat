const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
        type: String, 
        enum: ['friend_request_sent', 'friend_request_accepted', 'new_message', 'map_interaction', 'security_alert'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object, default: {} }, // For flexibility (e.g., senderId, chatId)
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
