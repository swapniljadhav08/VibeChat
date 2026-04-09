const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        text: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Chat', ChatSchema);
