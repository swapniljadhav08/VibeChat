const User = require('../models/User');

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId);

        let filter = { _id: { $ne: currentUserId } };
        if (query) {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } }
            ];
        }

        const users = await User.find(filter).select('displayName username photoURL').limit(50);

        // Convert ObjectIds to strings for O(1)/O(N) safe comparison
        const friendStrs = currentUser.friends.map(id => id.toString());
        const sentStrs = currentUser.sentRequests.map(id => id.toString());
        const receivedStrs = currentUser.friendRequests.map(id => id.toString());

        const usersWithStatus = users.map(u => {
            const userObj = u.toObject();
            const uIdStr = u._id.toString();
            if (friendStrs.includes(uIdStr)) userObj.status = 'friend';
            else if (sentStrs.includes(uIdStr)) userObj.status = 'sent';
            else if (receivedStrs.includes(uIdStr)) userObj.status = 'received';
            else userObj.status = 'none';
            return userObj;
        });

        res.json({ users: usersWithStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error searching users' });
    }
};

exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friends', 'displayName username photoURL');
        res.json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching friends' });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('friendRequests', 'displayName username photoURL');
        res.json({ requests: user.friendRequests });
    } catch (error) {
        res.status(500).json({ error: 'Server Error fetching requests' });
    }
};

exports.sendRequest = async (req, res) => {
    try {
        const { targetId } = req.body;
        const currentUserId = req.user._id;

        if (targetId === String(currentUserId)) return res.status(400).json({ error: 'Cannot add yourself' });

        await User.findByIdAndUpdate(currentUserId, { $addToSet: { sentRequests: targetId } });
        await User.findByIdAndUpdate(targetId, { $addToSet: { friendRequests: currentUserId } });
        res.json({ message: 'Request sent' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error sending request' });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const { targetId } = req.body;
        const currentUserId = req.user._id;

        await User.findByIdAndUpdate(currentUserId, {
            $pull: { friendRequests: targetId },
            $addToSet: { friends: targetId }
        });
        await User.findByIdAndUpdate(targetId, {
            $pull: { sentRequests: currentUserId },
            $addToSet: { friends: currentUserId }
        });
        res.json({ message: 'Request accepted' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error accepting request' });
    }
};
