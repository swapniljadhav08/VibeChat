const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Fetch latest 50
        
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        if (notificationId === 'all') {
            await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        } else {
            await Notification.findOneAndUpdate(
                { _id: notificationId, userId: req.user._id },
                { isRead: true }
            );
        }
        
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error updating notification' });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const User = require('../models/User');
        const { inApp, push, email } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.notificationPreferences = {
            inApp: inApp !== undefined ? inApp : user.notificationPreferences?.inApp ?? true,
            push: push !== undefined ? push : user.notificationPreferences?.push ?? false,
            email: email !== undefined ? email : user.notificationPreferences?.email ?? false,
        };

        await user.save();
        res.json({ preferences: user.notificationPreferences });
    } catch (error) {
        res.status(500).json({ error: 'Server Error updating preferences' });
    }
};
