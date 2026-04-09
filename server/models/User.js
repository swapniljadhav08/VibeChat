const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    displayName: { type: String },
    dateOfBirth: { type: Date },
    username: { type: String, unique: true },
    photoURL: { type: String },
    snapScore: { type: Number, default: 0 },
    location: {
        lat: Number,
        lng: Number,
        lastUpdated: Date
    },
    locationPrivacy: {
        mode: { type: String, enum: ['GHOST', 'FRIENDS', 'CUSTOM'], default: 'FRIENDS' },
        allowedFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
