const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Centralized function to send a notification
 * @param {Object} io - Socket.io instance
 * @param {String} userId - Target user ID (MongoDB ObjectId)
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data payload
 */
const sendNotification = async (io, userId, type, title, message, data = {}) => {
    try {
        // 1. Get user preferences
        const user = await User.findById(userId);
        if (!user) return;

        const prefs = user.notificationPreferences || { inApp: true, push: false, email: false };

        // Basic Rate Limiting: Avoid duplicate notifications within 1 minute
        // Find recent notification of same type for this user within last minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentNotification = await Notification.findOne({
            userId,
            type,
            title, // Match title to avoid rate limiting different chats/users too aggressively
            createdAt: { $gte: oneMinuteAgo }
        });

        if (recentNotification && type !== 'new_message') {
            // We might want to rate limit messages differently, or group them. 
            // For now, if we sent the exact same title/type 1 min ago, skip it.
            console.log('Notification rate limited:', type);
            return;
        }

        let savedNotification = null;

        // 2. Save to DB if in-app is enabled (or generally we always save it?)
        // Let's always save it for history, or respect inApp pref. Let's save it.
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data
        });
        savedNotification = await notification.save();

        // 3. Emit socket event for real-time update
        if (prefs.inApp && io) {
            // Find if user is online, emit to their specific room. 
            // Wait, currently sockets.js handles online users via `onlineUsers` map.
            // But we don't have access to the `onlineUsers` map from here.
            // Wait, we can emit to a specific user if they joined a room with their userId!
            // Let's modify sockets.js to have users join a room with their userId on `register_user`.
            io.to(userId.toString()).emit('new_notification', savedNotification);
        }

        // 4. Trigger Push Notification (FCM)
        if (user.fcmToken) {
            const admin = require('../config/firebase'); // Make sure this is required
            const pushPayload = {
                token: user.fcmToken,
                notification: {
                    title,
                    body: message
                },
                data: {
                    type,
                    // FCM data values must be strings
                    ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
                }
            };
            
            try {
                await admin.messaging().send(pushPayload);
                console.log('Successfully sent FCM push notification');
            } catch (fcmError) {
                console.error('Error sending FCM push:', fcmError);
                // If token is invalid/unregistered, you might want to remove it from DB
                if (fcmError.code === 'messaging/registration-token-not-registered') {
                    await User.findByIdAndUpdate(userId, { $unset: { fcmToken: "" } });
                }
            }
        }

        // 5. Trigger Email (Future)
        if (prefs.email) {
            // emailService.send(...)
        }

        return savedNotification;
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

module.exports = { sendNotification };
