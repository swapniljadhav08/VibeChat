const User = require('../models/User');
const Story = require('../models/Story');

exports.getMapData = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const currentUser = await User.findById(currentUserId);
        
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        // Retrieve friends' locations, factoring in their privacy
        const friendsList = await User.find({ _id: { $in: currentUser.friends } });
        
        const activeLocations = [];
        
        friendsList.forEach(otherUser => {
            // Check their privacy
            const mode = otherUser.locationPrivacy?.mode || 'FRIENDS';
            let canSee = false;
            
            if (mode === 'FRIENDS') {
                // By default, showing all people as requested
                canSee = true;
            } else if (mode === 'CUSTOM') {
                canSee = otherUser.locationPrivacy.allowedFriends.includes(currentUserId);
            } // If GHOST, canSee remains false

            // Also check if they have a valid location
            if (canSee && otherUser.location?.lat && otherUser.location?.lng) {
                // Add to active locations
                activeLocations.push({
                    _id: otherUser._id,
                    username: otherUser.username,
                    displayName: otherUser.displayName,
                    photoURL: otherUser.photoURL,
                    location: otherUser.location,
                    lastUpdated: otherUser.location.lastUpdated
                });
            }
        });

        // Add dummy cluster/heatmap data generation logic here if needed or just return coordinates
        // Map stories logic
        const mapStories = await Story.find({
            isMapStory: true,
            expiresAt: { $gt: new Date() }
        }).populate('userId', 'displayName photoURL username');

        res.json({
            users: activeLocations,
            mapStories: mapStories
        });

    } catch (error) {
        console.error('Error in getMapData:', error);
        res.status(500).json({ error: 'Server error fetching map data' });
    }
};

exports.updatePrivacy = async (req, res) => {
    try {
        const { mode, allowedFriends } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user.locationPrivacy) user.locationPrivacy = {};
        
        if (mode) user.locationPrivacy.mode = mode;
        if (allowedFriends) user.locationPrivacy.allowedFriends = allowedFriends;
        
        await user.save();
        res.json({ success: true, locationPrivacy: user.locationPrivacy });
    } catch (error) {
        console.error('Error updating privacy:', error);
        res.status(500).json({ error: 'Server error updating privacy' });
    }
};

exports.postMapStory = async (req, res) => {
    // Standard story posting flow, but with coordinates
    try {
        const { mediaUrl, mediaType, lat, lng } = req.body;
        const newStory = new Story({
            userId: req.user._id,
            mediaUrl,
            mediaType,
            location: { lat, lng },
            isMapStory: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        await newStory.save();
        res.status(201).json({ success: true, story: newStory });
    } catch (error) {
        console.error('Error posting map story:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
